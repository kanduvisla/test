---
title: Edit PDF Templates
---
# How to edit PDF Templates

## PDF Invoice

The class you want to rewrite is `Magento\Sales\Model\Order\Pdf\Invoice`. The method
responsible for rendering the PDF is the public method `getPdf()`. So this can be intercepted
using a plugin.

If you want to change the rendering of a single item, you need to figure out which renderer you
need to address. For invoice items, this renderer is `Magento\Sales\Model\Order\Pdf\Items\Invoice\DefaultInvoice`.
This renderer has a public `draw()`-method, so you can use a plugin to intercept this.

If you need to add an extra column to the items grid in the PDF, 
you need to rewrite the protected method `_drawHeader()`. Since this method is protected, you need
to rewrite is this class and cannot use an interceptor.