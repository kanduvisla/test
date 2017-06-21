---
title: Convert an Order to a Shipment
---

I've recently found [a small article](https://ranasohel.me/2016/08/18/how-to-create-shipment-programmatically-in-magento2/)
on how to convert an order to a shipment in Magento 2, but the code in question was a bit outdated.

For example, it leaned heavily on the Object Manager instead of handling it with dependency injection
and repositories.

For that reason, I rewrote the code a bit to make it more compatible with Magento 2.1.x:
 
```php
<?php

use Magento\Framework\Exception\LocalizedException;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Api\ShipmentRepositoryInterface;

/**
 * Class OrderToShipment
 */
class OrderToShipment
{
    /**
     * @var OrderRepositoryInterface
     */
    protected $orderRepository;

    /**
     * @var \Magento\Sales\Model\Convert\Order
     */
    protected $convertOrder;

    /**
     * @var ShipmentRepositoryInterface
     */
    protected $shipmentRepository;

    /**
     * Order constructor.
     * @param OrderRepositoryInterface $orderRepository
     * @param ShipmentRepositoryInterface $shipmentRepository
     * @param \Magento\Sales\Model\Convert\Order $convertOrder
     */
    public function __construct(
        OrderRepositoryInterface $orderRepository,
        ShipmentRepositoryInterface $shipmentRepository,
        \Magento\Sales\Model\Convert\Order $convertOrder
    )
    {
        $this->orderRepository = $orderRepository;
        $this->shipmentRepository = $shipmentRepository;
        $this->convertOrder = $convertOrder;
    }

    /**
     * @param int $orderId
     * @return \Magento\Sales\Model\Order\Shipment
     * @throws LocalizedException
     */
    public function createShipmentFromOrderId(int $orderId)
    {
        /** @var \Magento\Sales\Model\Order $order */
        $order = $this->orderRepository->get($orderId);

        if (!$order->canShip()) {
            throw new LocalizedException(__('Order cannot be shipped.'));
        }

        // Create the shipment:
        $shipment = $this->convertOrder->toShipment($order);

        // Add items to shipment:
        foreach ($order->getAllItems() as $orderItem) {
            if (!$orderItem->getQtyToShip() || $orderItem->getIsVirtual()) {
                continue;
            }

            $qtyShipped = $orderItem->getQtyToShip();
            $shipmentItem = $this->convertOrder->itemToShipmentItem($orderItem)->setQty($qtyShipped);
            $shipment->addItem($shipmentItem);
        }

        // Register the shipment:
        $shipment->register();
        
        try {
            $this->shipmentRepository->save($shipment);
            $this->orderRepository->save($shipment->getOrder());
        } catch (\Exception $e) {
            throw new LocalizedException(__($e->getMessage()));
        }

        return $shipment;
    }
}
```
