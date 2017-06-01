---
title: Edit PDF Templates
---
# How to edit PDF Templates

## PDF Invoice

The class you want to rewrite is `\Magento\Sales\Model\Order\Pdf\Invoice`. The method
responsible for rendering the PDF is the public method `getPdf()`. So this can be intercepted
using a plugin.

If you however want to modify the way the products are rendered, you need to rewrite the
protected methods `_drawHeader()` and `_drawItem()`. Since these methods are protected, you need
to rewrite is this class and cannot use an interceptor.