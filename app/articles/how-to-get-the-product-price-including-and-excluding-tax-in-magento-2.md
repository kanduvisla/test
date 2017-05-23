---
title: How to get the product price including and excluding tax in Magento 2
date: 2017-03-06
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - Tax
  - Catalog
---

# How to get the product price including and excluding tax in Magento 2

It seems like a simple task: get the price of a product in Magento including and/or excluding tax in Magento 2. I mean, how hard can it be? Well, to answer this question you must know that there are certain parameters in Magento 2 that determine the tax rate of a product:

- The configuration setting if your catalog prices are including or excluding tax.
- The current store (because different stores can have different countries that can have different tax rates).
- The current customers' customer group (because different customer groups can have different tax rates).

There are also some other parameters, like if the product has a special price or not, but for the sake if simplicity we'll leave those out of the equation.

## Step 1: Determine the products' tax class

This first step is easy. Just load the product and ask for it's `tax_class_id`:

    if ($product = $this->productRepository->getById($productId)) {
        if ($taxAttribute = $product->getCustomAttribute('tax_class_id')) {
            $productRateId = $taxAttribute->getValue();
            ...
            
This is the tax class that is applied to the product. Beware: the tax _class_ is not the tax _rate_. The tax class simply states the 'tax group' the product is set to. Like 'Taxable Goods' for example, or 'Food' and 'Non Food'. The rates applied to these classes are configured in your store under `Store > Taxes`.

## Step 2: Determine the tax rate

This step might seem a bit more difficult, but it's actually very easy due to the Service Contracts that are available. In this case we can use the `Magento\Tax\Api\TaxCalculationInterface` which has a `getCalculatedRate()`-method that returns our tax rate:

    $rate = $this->taxCalculation->getCalculatedRate($productRateId);

This method also has 2 additional parameters: customer ID and store ID, so we can use those if we want to have a tax rate for a specific customer or store. If you omit them, the current customer and store are used.

## Step 3: Determine if the catalog prices are including or excluding tax

The third step is to check the configuration to determine if the catalog prices are including or excluding tax:

    if ((int) $this->scopeConfig->getValue('tax/calculation/price_includes_tax', ScopeInterface::SCOPE_STORE) === 1) {
        // Product price in catalog is including tax.
        $priceExcludingTax = $product->getPrice() / (1 + ($rate / 100));
    } else {
        // Product price in catalog is excluding tax.
        $priceExcludingTax = $product->getPrice();
    }
    
At this point, we already know our products' price excluding tax. So to wrap it all up:

## Step 4: Calculate the price including tax

This part is easy:

    $priceIncludingTax = $priceExcludingTax + ($priceExcludingTax * ($rate / 100));
    
## Conclusion

A simple example, yet it shows a great practical use of Service Contracts and the various parameters of a typical Magento 2 installation that can make this a bit more of a difficult task. Here's the complete method including it's dependencies to wrap it all up:

    /**
     * @var \Magento\Catalog\Api\ProductRepositoryInterface
     */
    protected $productRepository;

    /**
     * @var \Magento\Tax\Api\TaxCalculationInterface
     */
    protected $taxCalculation;

    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $scopeConfig;

    /**
     * Constructor call
     * @param \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Tax\Api\TaxCalculationInterface $taxCalculation
     */
    public function __construct(
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepository,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Tax\Api\TaxCalculationInterface $taxCalculation
    ) {
        $this->productRepository = $productRepository;
        $this->scopeConfig = $scopeConfig;
        $this->taxCalculation = $taxCalculation;
    }

    /**
     * @param int $productId
     * @throws \Magento\Framework\Exception\NoSuchEntityException
     * @throws \Magento\Framework\Exception\LocalizedException
     * @return array
     */
    public function getPriceInclAndExclTax(int $productId): array
    {
        $product = $this->productRepository->getById($productId);
        
        if ($taxAttribute = $product->getCustomAttribute('tax_class_id')) {
            // First get base price (=price excluding tax)
            $productRateId = $taxAttribute->getValue();
            $rate = $this->taxCalculation->getCalculatedRate($productRateId);

            if ((int) $this->scopeConfig->getValue(
                'tax/calculation/price_includes_tax', 
                \Magento\Store\Model\ScopeInterface::SCOPE_STORE) === 1
            ) {
                // Product price in catalog is including tax.
                $priceExcludingTax = $product->getPrice() / (1 + ($rate / 100));
            } else {
                // Product price in catalog is excluding tax.
                $priceExcludingTax = $product->getPrice();
            }

            $priceIncludingTax = $priceExcludingTax + ($priceExcludingTax * ($rate / 100));
            
            return [
                'incl' => $priceIncludingTax,
                'excl' => $priceExcludingTax
            ];
        }

        throw new LocalizedException(__('Tax Attribute not found'));
    }

This example returns an array with both the including and excluding prices for the current customer / store, regardless of what the configuration setting is. This example sure could be a bit more improved, for example: have a method for getting either the including or excluding price instead of return an associated array, but for this example this will do just fine.