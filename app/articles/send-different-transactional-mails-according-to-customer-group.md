---
title: Sending different transactional mails according to the Customer Group in Magento 2
date: 2017-02-20
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - Customers
  - Transactional Mails
---

# Send different transactional mails according to customer group

To do this, we need to add some extra options to our customer groups.
At the moment of writing (Magento 2.1.4), the form to edit a customer group is not yet
build using UI Componenents, but in the old-fashioned way, with PHP Forms. So it could
be that in the future parts of this article are no longer valid.

## Step 1: Link the e-mail template to the customer group

The first thing we need to do, is make sure that the customer group knows what e-mail
template to use. So we need to facilitate functionality in the admin where an e-mail
template can be linked to a customer group. To do this, we need to manipulate the fieldset
that is created in `Magento\Customer\Block\Adminhtml\Group\Edit\Form`.

As we all know, blocks have a protected method called `_prepareLayout()` that is responsible 
for adding fields and such to the layout. This is a perfect entry point for us to begin
manipulating our fieldset.

Now we could do this with a rewrite (since the method is protected), but in Magento 2 you 
need to avoid rewrites as much as possible. So if we dive deeper into the code we finally
find the wrapping method that calles `_prepareLayout()`, which is the public method 
`\Magento\Framework\View\Element\AbstractBlock::setLayout()`.

Now, since this is a **public** method we can use a plugin to manipulate our form. So in
you `etc/adminhtml/di.xml`, add the following rule:

    <type name="Magento\Customer\Block\Adminhtml\Group\Edit\Form">
        <plugin name="add_email_template" 
                type="Vendor\Module\Plugin\Magento\Customer\Block\Adminhtml\Group\Edit\Form"/>
    </type>

And the code of our plugin:

    namespace Vendor\Module\Plugin\Magento\Customer\Block\Adminhtml\Group\Edit;
    
    /**
     * Class Form
     */
    class Form
    {
        /**
         * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject
         * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
         * @return \Magento\Customer\Block\Adminhtml\Group\Edit\Form
         */
        public function afterSetLayout(
            \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject,
            \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
        ) {
            // Add a new fieldset:
            $fieldset = $result->getForm()->addFieldset(
                'email_templates', 
                ['legend' => __('Email Templates')]
            );
    
            return $result;
        }
    }

Now we have an entry point where we can add extra fields to our form.

## Step 2: Create a list of e-mail templates to pick from

Now, there are a lot of e-mail templates to pick from, like order mails, order comments,
sales, credit memos, etc. If you want to cover it all, you have to write it all. But 
for the sake of simplicity of this article let's just focus on one: The order confirmation
mail. Now, since we're aiming at sending a specific mail to a specific customer group, we
only have to deal with logged in members.

If we look at the system configuration, and we go to `Sales > Sales Emails > Order > New Order Confirmation Template`
we have a nice dropdown of e-mail templates to pick from. However, these are in the global
scope. What we want, is to have this dropdown in our customer group form.

So let's just look at the `etc/adminhtml/system.xml` of the sales module to see what source model is used
to build this list: `Magento\Config\Model\Config\Source\Email\Template`. So let's include
this source model as a dependency in our plugin, and add a select-element that is populated
with the available e-mail templates:

    /**
     * @var \Magento\Config\Model\Config\Source\Email\Template
     */
    protected $emailTemplateSource;

    /**
     * Form constructor.
     */
    public function __construct(
        \Magento\Config\Model\Config\Source\Email\Template $emailTemplateSource
    ) {
        $this->emailTemplateSource = $emailTemplateSource;
    }

    /**
     * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject
     * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
     * @return \Magento\Customer\Block\Adminhtml\Group\Edit\Form
     */
    public function afterSetLayout(
        \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject,
        \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
    ) {
        // Add a new fieldset:
        $fieldset = $result->getForm()->addFieldset('email_templates', ['legend' => __('Email Templates')]);

        $fieldset->addField(
            'order_email_template',
            'select',
            [
                'name'   => 'order_email_template',
                'label'  => __('Order E-Mail Template'),
                'title'  => __('Order E-Mail Template'),
                'values' => $this
                    ->emailTemplateSource
                    ->toOptionArray(),
            ]
        );

        return $result;
    }

Boom! If you did everything correctly, you should now get an `UnexpectedValueException` stating
`Email template '' is not defined`. Don't worry, this is the correct behaviour. The problem is that
our source model has no information on what e-mail templates it should show.

So lets fix this problem.

Since we instantiated our source model using dependency injection rather than grabbing it from the XML,
our source model has never been given the proper `path`-parameter. Hence the exception that is thrown.
If you want to know more about this issue, I'd suggest that you read _this article_.
The fix? Very easy: just set the path as it would have been set by the configuration parameter:

    'values' => $this
        ->emailTemplateSource
        ->setData('path', 'sales_email/order/template')
        ->toOptionArray(),

And that's that! We're done with this step. Now... displaying the email templates is one, next up:

## Step 3: Saving the selected email template

The first step into saving the value of the newly added dropdown is to determine where it's stored.
Now, in the past (or in Magento 1), you might have just added a column to the `customer_group`-table
in the database, but in Magento 2 this is not done.

Instead we now have this thing called **extension attributes**. Which might seem complex at first, but
it's actually really great. It forces 3rd party developers to not polute the native database tables of
other modules, but rather keep their own data separate.

So first things first, create a setup script that installs the schema for us that stores the selected
email templates. This file is located at `Setup/InstallSchema.php`:

    use Magento\Framework\DB\Ddl\Table;
    use Magento\Framework\Setup\InstallSchemaInterface;
    use Magento\Framework\Setup\ModuleContextInterface;
    use Magento\Framework\Setup\SchemaSetupInterface;
    
    /**
     * Class UpgradeSchema
     */
    class InstallSchema implements InstallSchemaInterface
    {
        /**
         * @param SchemaSetupInterface $setup
         * @param ModuleContextInterface $context
         * @return mixed
         */
        public function install(SchemaSetupInterface $setup, ModuleContextInterface $context)
        {
            $setup->startSetup();
    
            // Create a table where we store the relations between customer group and e-mail templates:
            $table = $setup->getConnection()
                ->newTable($setup->getTable('customer_group_email_templates'))
                ->addColumn(
                    'group_id',
                    Table::TYPE_SMALLINT,
                    null,
                    [
                        'unsigned' => true,
                        'nullable' => false,
                        'primary'  => true
                    ],
                    null
                )
                ->addColumn(
                    'order_email_template',
                    Table::TYPE_TEXT,
                    null,
                    ['nullable' => true],
                    null
                )
                ->addForeignKey(
                    $setup->getFkName(
                        'customer_group_email_templates',
                        'group_id',
                        'customer_group',
                        'customer_group_id'
                    ),
                    'customer_group_id',
                    $setup->getTable('customer_group'),
                    'customer_group_id',
                    Table::ACTION_CASCADE
                )
                ->setComment('Table containing e-mail templates of customer groups');
            $setup->getConnection()->createTable($table);
    
            $setup->endSetup();
        }
    }

Now, since we know we're already going to need some CRUD operations for this, let's just create
a service contract for this while we're at it. So lets just add an interface first. I'm calling it
`GroupMailManagementInterface`:

    /**
     * Interface GroupMailManagementInterface
     */
    interface GroupMailManagementInterface
    {
        /**
         * @param int $groupId
         * @param string $template
         * @return mixed
         */
        public function saveOrderEmailTemplate(int $groupId, string $template);
    
        /**
         * @param int $groupId
         * @return string
         */
        public function getOrderEmailTemplate(int $groupId): string;
    }

Set the dependency preference in our `etc/di.xml`:

    <preference for="Vendor\Module\Api\GroupMailManagementInterface"
                type="Vendor\Module\Model\GroupMailManagement"/>

Now I'm not going to discuss here what's the best way to deal with persistent storage. I could go
full-blown and add a repository and stuff, but for the sake of what we're trying to achieve (and what
I'm trying to explain in this article) I'm keeping it as simple as possible. That's why I'm just
going to query the database in my `GroupMailManagement`-class. But hey! That's the beauty of Service Contracts;
depend on abstraction, not concretion. I don't care _how_ it's stored in the database, just as long as
it _is_ stored in the database!

So for full disclosure, this is what our implementation of `GroupMailManagement` looks like:

    use Vendor\Module\Api\GroupMailManagementInterface;
    use Magento\Framework\App\ResourceConnection;
    
    /**
     * Class GroupMailManagement
     */
    class GroupMailManagement implements GroupMailManagementInterface
    {
        /**
         * @var ResourceConnection
         */
        protected $resource;
    
        /**
         * GroupMailManagement constructor.
         */
        public function __construct(
            ResourceConnection $resourceConnection
        ) {
            $this->resource = $resourceConnection;
        }
    
        /**
         * @param int $groupId
         * @param string $template
         */
        public function saveOrderEmailTemplate(int $groupId, string $template)
        {
            $this->resource->getConnection()
                ->query(sprintf(
                    'INSERT INTO %1$s (`group_id`, `order_email_template`) 
                     VALUES (:group_id, :template) 
                     ON DUPLICATE KEY UPDATE `order_email_template` = :template',
                    $this->resource->getTableName('customer_group_email_templates')
                ), [
                    'group_id' => $groupId,
                    'template' => $template
                ]);
        }
    
        /**
         * @param int $groupId
         * @return string
         */
        public function getOrderEmailTemplate(int $groupId): string
        {
            return $this->resource->getConnection()
                ->fetchOne(sprintf(
                    'SELECT `order_email_template` FROM %1$s WHERE `group_id` = :group_id',
                    $this->resource->getTableName('customer_group_email_templates')
                ), [
                    'group_id' => $groupId
                ]);
        }
    }

Pretty straight to the point. Just save and load it. Nothing more. Now, let's register our extension
attributes shalle we? Create a file in the `etc`-folder called `extension_attributes.xml` and add
the following to it:

    <?xml version="1.0" encoding="UTF-8"?>
    <config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:noNamespaceSchemaLocation="urn:magento:framework:Api/etc/extension_attributes.xsd">
        <extension_attributes for="Magento\Customer\Api\Data\GroupInterface">
            <attribute code="order_email_template" type="string">
                <!-- 
                    Join the proper table: 
                -->
                <join reference_table="customer_group_email_templates"
                      join_on_field="customer_group_id"
                      reference_field="group_id">
                    <field>order_email_template</field>
                </join>
            </attribute>
        </extension_attributes>
    </config>

(todo) explanation

Now the next thing we need
to do is hook this into our save- and load- events of the customer groups. Now if you think
we could use an event for that or rewrite a model you're wrong. Although an implementation as such
might work, it's not the proper way to do this in Magento 2.

The right way is to hook into the Service Contracts provided by the customer module. The customer 
group repository in particular. After all, if we look at `Magento\Customer\Api\GroupRepositoryInterface`
we see we have a nice `save()` and `getById()`-method we can hook a plugin into. So let's do that.

First of, declare your plugin in `etc/di.xml`:

    <!--
        Plugin for the group repository:
    -->
    <type name="Magento\Customer\Api\GroupRepositoryInterface">
        <plugin name="email_templates_plugin"
                type="Vendor\Module\Plugin\Magento\Customer\Model\ResourceModel\GroupRepository"/>
    </type>

And in our plugin, we're going to utilize the `afterSave()` and `afterGetById()`-methods to 
hook our freshly written `GroupMailManagement` into:

    use Vendor\Module\Api\GroupMailManagementInterface;
    use Magento\Framework\App\Request\Http;
    
    /**
     * Class GroupRepository
     */
    class GroupRepository
    {
        /**
         * @var Http
         */
        protected $request;
    
        /**
         * @var \Magento\Customer\Api\Data\GroupExtensionFactory
         */
        protected $extensionFactory;
    
        /**
         * @var GroupMailManagementInterface
         */
        protected $groupMailManagement;
    
        /**
         * GroupRepository constructor.
         * @param Http $request
         * @param \Magento\Customer\Api\Data\GroupExtensionFactory $extensionFactory
         * @param GroupMailManagementInterface $groupMailManagement
         */
        public function __construct(
            Http $request,
            \Magento\Customer\Api\Data\GroupExtensionFactory $extensionFactory,
            GroupMailManagementInterface $groupMailManagement
        ) {
            $this->request = $request;
            $this->extensionFactory = $extensionFactory;
            $this->groupMailManagement = $groupMailManagement;
        }
    
        /**
         * @param \Magento\Customer\Model\ResourceModel\GroupRepository $subject
         * @param \Magento\Customer\Api\Data\GroupInterface $result
         * @return \Magento\Customer\Api\Data\GroupInterface
         */
        public function afterSave(
            \Magento\Customer\Model\ResourceModel\GroupRepository $subject,
            \Magento\Customer\Api\Data\GroupInterface $result
        ) {
            if ($template = $this->request->getParam('order_email_template')) {
                // Save the selected e-mail template:
                $this->groupMailManagement->saveOrderEmailTemplate($result->getId(), $template);
                // Add extension attribute back to result:
                $extensionAttributes = $result->getExtensionAttributes() ?? $this->extensionFactory->create();
                $extensionAttributes->setOrderEmailTemplate($template);
                $result->setExtensionAttributes($extensionAttributes);
            }
    
            return $result;
        }
    
        /**
         * @param \Magento\Customer\Model\ResourceModel\GroupRepository $subject
         * @param \Magento\Customer\Api\Data\GroupInterface $result
         */
        public function afterGetById(
            \Magento\Customer\Model\ResourceModel\GroupRepository $subject,
            \Magento\Customer\Api\Data\GroupInterface $result
        ) {
            // Get the extension attribute:
            $extensionAttributes = $result->getExtensionAttributes();
            if (!$extensionAttributes) {
                $extensionAttributes = $this->extensionFactory->create();
            }
    
            // Get the proper e-mail template:
            $extensionAttributes->setOrderEmailTemplate(
                $this->groupMailManagement->getOrderEmailTemplate($result->getId())
            );
            $result->setExtensionAttributes($extensionAttributes);
    
            return $result;
        }
    }

Now that we've hooked into our repositories' `save()` and `getById()`-method we can be sure
that our data is saved and loaded correctly. However, if we go back to our customer group edit-form
we'll see that the value we've saved is not properly loaded. This is because the form doesn't yet
know the proper value of `order_email_template`. To fix this, we have to include our management
class in our Form plugin (using dependency injection) and set the proper value too. So our final
plugin will look like this:

    use Vendor\Module\Api\GroupMailManagementInterface;
    
    /**
     * Class Form
     */
    class Form
    {
        /**
         * @var \Magento\Config\Model\Config\Source\Email\Template
         */
        protected $emailTemplateSource;
    
        /**
         * @var GroupMailManagementInterface
         */
        protected $groupMailManagement;
    
        /**
         * Form constructor.
         */
        public function __construct(
            \Magento\Config\Model\Config\Source\Email\Template $emailTemplateSource,
            GroupMailManagementInterface $groupMailManagement
        ) {
            $this->emailTemplateSource = $emailTemplateSource;
            $this->groupMailManagement = $groupMailManagement;
        }
    
        /**
         * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject
         * @param \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
         * @return \Magento\Customer\Block\Adminhtml\Group\Edit\Form
         */
        public function afterSetLayout(
            \Magento\Customer\Block\Adminhtml\Group\Edit\Form $subject,
            \Magento\Customer\Block\Adminhtml\Group\Edit\Form $result
        ) {
            // Add a new fieldset:
            $fieldset = $result->getForm()->addFieldset('email_templates', ['legend' => __('Email Templates')]);
    
            $fieldset->addField(
                'order_email_template',
                'select',
                [
                    'name'   => 'order_email_template',
                    'label'  => __('Order E-Mail Template'),
                    'title'  => __('Order E-Mail Template'),
                    'values' => $this
                        ->emailTemplateSource
                        ->setData('path', 'sales_email/order/template')
                        ->toOptionArray(),
                ]
            );
    
            if ($groupId = $result->getForm()->getElement('id')->getData('value')) {
                $result->getForm()->addValues([
                    'order_email_template' => $this->groupMailManagement->getOrderEmailTemplate($groupId)
                ]);
            }
    
            return $result;
        }
    }

At this point we've already covered one of the most important parts of what we're trying to achieve:
Link an e-mail template to a customer group. Now it's time for the next step:

## Step 4: Selecting the proper e-mail template when sending the mail

This step is the part where it all comes together: at some point Magento decides it needs to send
an order confirmation mail. It's this part of the code where we need to hook in to and modify the
template that is picked.

So the first part of this noble quest is to find out where exactly the order e-mails are being sent.
To find out where this is, I always start my search at the service contracts a specific module has to
offer. And what do you know? If you look at `Magento\Sales\Api\OrderManagementInterface` you'll note
a tiny little method called `notify()`:

    /**
     * Emails a user a specified order.
     *
     * @param int $id The order ID.
     * @return bool
     */
    public function notify($id);

This kind of looks like what the place where we want to hook into. Se let's just look at the
implementation of this method:

    /**
     * Notify user
     *
     * @param int $id
     * @return bool
     */
    public function notify($id)
    {
        $order = $this->orderRepository->get($id);
        return $this->notifier->notify($order);
    }

Aha, so there seems to be a `notifier` of some sort. I'm curious about what this is. Looking at the
code it points me to the class `Magento\Sales\Model\OrderNotifier`, which extends `Magento\Sales\Model\AbstractNotifier`.

This `notify()`-method has a `sender`-property, which sends the e-mail. And if we look at the order
notifier, we know that `sender` is in this case an instance of `Magento\Sales\Model\Order\Email\Sender\OrderSender`.

And if we look at `Magento\Sales\Model\Order\Email\Sender\OrderSender::send()`, we see that this calls
`Magento\Sales\Model\Order\Email\Sender::checkAndSend()`. And if we look at this method, we see it calls a method
called `prepareTemplate()`. Now, if we want to hook into the the place in the code where Magento determines what
template to choose from, this is probably a good place to look:

    protected function prepareTemplate(Order $order)
    {
        $this->templateContainer->setTemplateOptions($this->getTemplateOptions());

        if ($order->getCustomerIsGuest()) {
            $templateId = $this->identityContainer->getGuestTemplateId();
            $customerName = $order->getBillingAddress()->getName();
        } else {
            $templateId = $this->identityContainer->getTemplateId();
            $customerName = $order->getCustomerName();
        }

        $this->identityContainer->setCustomerName($customerName);
        $this->identityContainer->setCustomerEmail($order->getCustomerEmail());
        $this->templateContainer->setTemplateId($templateId);
    }

Hey, this looks interesting! This method already checks if the customer is a guest or not, and gets
the `$templateId` using `getGuestTemplateId()` and `getTemplateId()`. Now, both of these are public
methods so the most obvious thing to do is simply write a plugin that hooks into `Magento\Sales\Model\Order\Email\Container\IdentityInterface::getTemplateId()` to modify the
resulting template ID of this method.

But doing so causes some difficult tasks to overcome. For instance, service contracts are very abstracted,
so we have no idea of knowing which customer or order we're using. And since the e-mail can also be sent
from the backend, we also cannot rely on the customer session to determine the customer group.

A more logical approach would be to go further down the chain, to
`Magento\Sales\Model\Order\Email\Container\Template::setTemplateId()`. If we hook into this method we
have access to our template variables, and in our situation, we know for a fact that the order model will
be among them.

So, let's add the following to our `etc/di.xml`:

    <type name="Magento\Sales\Model\Order\Email\Container\Template">
        <plugin name="email_templates_plugin"
                type="Vendor\Module\Plugin\Magento\Sales\Model\Order\Email\Container\Template"/>
    </type>

And hook into it:

    use Vendor\Module\Api\GroupMailManagementInterface;
    use Magento\Customer\Api\CustomerRepositoryInterface;
    use Magento\Framework\Exception\NoSuchEntityException;
    
    /**
     * Class Template
     */
    class Template
    {
        /**
         * @var CustomerRepositoryInterface
         */
        protected $customerRepository;
    
        /**
         * @var GroupMailManagementInterface
         */
        protected $groupMailManagement;
    
        /**
         * Template constructor.
         * @param CustomerRepositoryInterface $customerRepository
         * @param GroupMailManagementInterface $groupMailManagement
         */
        public function __construct(
            CustomerRepositoryInterface $customerRepository,
            GroupMailManagementInterface $groupMailManagement
        ) {
            $this->customerRepository = $customerRepository;
            $this->groupMailManagement = $groupMailManagement;
        }
    
        /**
         * @param \Magento\Sales\Model\Order\Email\Container\Template $subject
         * @param $templateId
         * @return mixed
         */
        public function beforeSetTemplateId(
            \Magento\Sales\Model\Order\Email\Container\Template $subject,
            $templateId
        ) {
            /** @var \Magento\Sales\Model\Order $order */
            if ($order = $subject->getTemplateVars()['order'] ?? false) {
                try {
                    $customer = $this->customerRepository->get($order->getCustomerEmail());
    
                    if ($customerGroupTemplate = $this
                        ->groupMailManagement
                        ->getOrderEmailTemplate($customer->getGroupId()
                        )
                    ) {
                        $templateId = $customerGroupTemplate;
                    }
                } catch (NoSuchEntityException $exception) {
                    // Customer not found in database.
                }
            }
    
            return [$templateId];
        }
    }
    
Let me explain the above code: (todo)

Everything seems to work fine now. However, there's still a major issue here: this plugin is injected into
every place where the sales module sends it's e-mails. So this includes stuff like Order comments, credit memo's,
invoices, etc. But we don't want that. We only want to intercept the mail in these 2 conditions:

- When a customer finishes it's order in the frontend.
- When the order mail is sent from the backend.

To do this, we can simply listen to our request. So let's add it as a dependency to our class:

    /**
     * @var \Magento\Framework\App\Request\Http
     */
    protected $request;

    /**
     * Template constructor.
     * @param CustomerRepositoryInterface $customerRepository
     * @param GroupMailManagementInterface $groupMailManagement
     * @param \Magento\Framework\App\Request\Http $request
     */
    public function __construct(
        CustomerRepositoryInterface $customerRepository,
        GroupMailManagementInterface $groupMailManagement,
        \Magento\Framework\App\Request\Http $request
    ) {
        $this->customerRepository = $customerRepository;
        $this->groupMailManagement = $groupMailManagement;
        $this->request = $request;
    }

And add some logic to our interceptor:

    /**
     * @param \Magento\Sales\Model\Order\Email\Container\Template $subject
     * @param $templateId
     * @return mixed
     */
    public function beforeSetTemplateId(
        \Magento\Sales\Model\Order\Email\Container\Template $subject,
        $templateId
    ) {
        // Only allow order e-mails from the admin or using the API (=checkout on frontend)
        if (
            $this->request->getFullActionName() === 'sales_order_email' ||
            $this->request->getRequestString() === '/rest/V1/carts/mine/payment-information'
        ) {
            /** @var \Magento\Sales\Model\Order $order */
            if ($order = $subject->getTemplateVars()['order'] ?? false) {
                try {
                    $customer = $this->customerRepository->get($order->getCustomerEmail());

                    if ($customerGroupTemplate = $this
                        ->groupMailManagement
                        ->getOrderEmailTemplate($customer->getGroupId()
                        )
                    ) {
                        $templateId = $customerGroupTemplate;
                    }
                } catch (NoSuchEntityException $exception) {
                    // Customer not found in database.
                }
            }
        }

        return [$templateId];
    }

A small sidenote, we cannot use `getFullActionName()` on an API call, since it would return `__`
in that case.