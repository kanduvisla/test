---
title: Customer Tax and Discount Rules in Magento 2
date: 2017-02-17
layout: article.html
published: true
lunr: true
tags:
  - Magento 2
  - Tax
  - Discount Rules
  - Customers
---

# Customer Tax and Discount Rules in Magento 2

Even though I've been working with Magento for some years now, the combination of 
discount rules and tax rules has always been some kind of mathematical mystery. In
basic, there are 2 parameters:

- Apply customer tax before or after the discount.
- Apply discount rules on prices on prices including or excluding tax.

The combination of these parameters has always been of some interesting results, but
whenever the client asked me _'why?'_, I had the break my brain once more on what it
all exactly meant.

So that's why I decided to spent some time examining these rules and their combinations,
analyzing the results and in the end, I came up with this article.

## The Examples

Basicly there are 4 combinations possible:

1. Apply Customer Tax **before** discount, and apply discount on prices **excluding tax**.
2. Apply Customer Tax **before** discount, and apply discount on prices **including tax**.
3. Apply Customer Tax **after** discount, and apply discount on prices **excluding tax**.
4. Apply Customer Tax **after** discount, and apply discount on prices **including tax**.

There are also 2 kind of discounts to consider:

1. A discount with a fixed amount (10 EURO for example).
2. A discount with a percentual amount (10% for example).

This together makes room for 8 different combinations / outcomes. So let's have a look...

### Fixed Discount amount

In all these examples, the catalog price is 30 EURO including tax, the discount is 10 EURO 
and the tax rate is 20%. This means that the catalog price excluding tax is 25 EURO and
the tax value is 5 EURO. So: 25.00 excl. 5.00 tax = 30.00 incl. tax.

#### Apply customer tax before discount

With this setting the customer tax is applied **before** the discount is applied. So it's
important to know _what_ the customer tax exactly is.

##### Apply discount on prices including tax

The discount is 10 EURO of our including price, so this means our new price including tax
is 20 EURO. The customer tax is applied before the discount is applied, so we
need to get the tax of our full price to the order, which is (20% of 25.00) = 5.00 EURO.

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10,- of subtotal incl.)   : -10.00
    Order total incl. tax               : 20.00
    Order total excl. tax               : 15.00
    Tax                                 : 5.00
        
Although the order total is what the customer would expect, the tax calculation might 
seem a bit odd: after all, of the order is 20 EURO incl. tax, if you calculate it back
the 20% you would expect to pay should be 3.33 EURO (and the order excl. tax should be
16.67 EURO).

The reason for this is that you pay the tax over the full price (30 EURO), not the 
discounted price. I'm not sure why you would want this (perhaps there are countries where
the tax rules states that discounts may not be taxed?). Otherwise I wouldn't know why
you would ever use this combination.

##### Apply discount on prices excluding tax

The discount is 10 EURO of our excluding price, so this means our new price excluding tax
is 15 EURO. The customer tax is applied before the discount is applied, so we
need to get apply the tax of our full price to the order, which is 5.00 EURO:

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10,- of subtotal incl.)   : -10.00
    Order total incl. tax               : 20.00
    Order total excl. tax               : 15.00
    Tax                                 : 5.00

This is funny. Although we have a different setup, we see that the outcome of our numbers
is exactly the same. This makes sense, since 10 EURO is 10 EURO, and the tax is in both cases
the same since we apply our customer tax _before_ the discount is applied.
    
So isn't there any difference? Yes there is, but not for fixed discount. But we'll get to that
later...

#### Apply customer tax after discount

With this setting the customer tax is applied **after** the discount is applied. So it's
important to know _what_ the discount exactly is.

##### Apply discount on prices including tax

The discount is 10 EURO of our including price, so this means our new inclusive price is 20 EURO.
The customer tax is applied after the discount is applied, so we
need to calculate tax from the full price of the order, which is (30.00 - 10.00) = 20.00 EURO.
20-(20/1.2) = 3.33 So the final tax is 3.33 EURO.

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10,- of subtotal incl.)   : -10.00
    Order total incl. tax               : 20.00
    Order total excl. tax               : 16.67
    Tax                                 : 3.33

This formula adds up and is in 99% the situations what you want:

- Offer discount on prices inclusive tax.
- Calculate the tax according to the newly calculated order total.

##### Apply discount on prices excluding tax

The discount is 10 EURO of our excluding price, so this means our new exclusive price is 20 EURO. 
Once again, 10 EURO is 10 EURO, so with fixed amounts of discount it doesn't really matter if
it's applied on the inclusive or exclusive price. The result will once again be the same:

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10,- of subtotal incl.)   : -10.00
    Order total incl. tax               : 20.00
    Order total excl. tax               : 16.67
    Tax                                 : 3.33

In the next part - Percentaul Discount amount - we'll dive deeper into the differences
between these 2 options, while for now their outcome might look the same to you.

### Percentual Discount amount

In all these examples, the catalog price is 30 EURO including tax, the discount is 10% 
and the tax rate is 20%. This means that the catalog price excluding tax is 25 EURO and
the tax value is 5 EURO. So: 25.00 excl. 5.00 tax, 30.00 incl. tax.

#### Apply customer tax before discount

With this setting the customer tax is applied **before** the discount is applied. So it's
important to know _what_ the customer tax exactly is.

##### Apply discount on prices including tax

The discount is 10% of our including price, so this means 10% of 30 EURO. Our
discount is 3 EURO. The customer tax is applied before the discount is applied, so we
need to get the tax of our full price to the order, which is (20% of 25.00) = 5.00 EURO.

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10% of subtotal incl.)    : -3.00
    Order total incl. tax               : 27.00
    Order total excl. tax               : 22.00
    Tax                                 : 5.00
        
Although the order total is what the customer would expect, the tax calculation might 
seem a bit odd: after all, of the order is 27 EURO incl. tax, if you calculate it back
the 20% you would expect to pay should be 4.5 EURO (and the order excl. tax should be
22.50 EURO).

The reason for this is that you pay the tax over the full price (30 EURO), not the 
discounted price. 

##### Apply discount on prices excluding tax

The discount is 10% of our excluding price, so this means 10% of 25 EURO. Our
discount is 2.5 EURO. The customer tax is applied before the discount is applied, so we
need to get apply the tax of our full price to the order, which is 5.00 EURO:

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10% of subtotal excl.)    : -2.50
    Order total incl. tax               : 27.50
    Order total excl. tax               : 22.50
    Tax                                 : 5.00
    
This is most likely not the order total the customer would expect, because the discount
is calculated from the price excluding tax. Also, if you calculate back, the 20% discount
you would expect would not be 5 EURO but rather 4.83 EURO (which would make the price excl.
tax 22.92 EURO).

In my opinion, this combination makes absolutely no sense:

- If you're a B2C site, and you communicate your prices and discounts including tax, the
customer would expect a discount of 3.00, not 2.50.
- If you're a B2B site, and you communicate your prices and discounts excluding tax, the
customer would expect an order total of 27.00 (4.50 tax, not 5.00) instead of 27.50.

I would not know in what situation you want have to use this combination.

#### Apply customer tax after discount

With this setting the customer tax is applied **after** the discount is applied. So it's
important to know _what_ the discount exactly is.

##### Apply discount on prices including tax

The discount is 10% of our including price, so this means 10% of 30 EURO. Our
discount is 3 EURO. The customer tax is applied after the discount is applied, so we
need to calculate tax from the full price of the order, which is (30.00 - 3.00) = 27.00 EURO.
27-(27/1.2) = 4.5. So the final tax is 4.50 EURO.

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10% of subtotal incl.)    : -3.00
    Order total incl. tax               : 27.00
    Order total excl. tax               : 22.50
    Tax                                 : 4.50

This formula adds up and is in 99% the situations what you want:

- Offer discount on prices inclusive tax.
- Calculate the tax according to the newly calculated order total.

##### Apply discount on prices excluding tax

The discount is 10% of our excluding price, so this means 10% of 25 EURO. Our
discount is 2.50 EURO. However, this is where it gets weird: because the customer tax is applied
**after** the discount, we need to subtract the discount of the inclusive price first, and then
recalculate the tax.

Summary:

    Product excl. tax (subtotal)        : 25.00
    Product incl. tax (subtotal)        : 30.00
    Discount (10% of subtotal excl.)    : -2.50
    Order total incl. tax               : 27.50
    Order total excl. tax               : 22.92
    Tax                                 : 4.58

The outcome of this formula might be weird to the customer. If he expects 10% discount of the
price included tax, he expects 3 EURO discount, not 2.50. For the rest the calculation adds up:
`27.50 / 1.20 = 22.92`, and `27.50 - 22.92 = 4.58`.

## In Conclusion

When it comes to fixed discount, the _'Apply discount on prices including / excluding tax'_
didn't seem to make a difference in the calculation. Only the _'Apply Tax before / after
discount'_ seemed to make a difference, although the whole 'calculating tax before discount'
resulted in 'weird' tax rates.

However... when it comes to percentual discount, we did see where the differences came in to
play. As a result of this test, we can conclude that the only logical combination you would 
likely want to have is _'Apply Tax after discount / apply discount on prices including tax'_. This is
the only setting that produces to proper expectations a customer would have, no matter if you're
communicating your prices including or excluding tax.

Giving these results you might wonder: _'Why all these settings when there is only one possible
correct solution?'_. That's a very good question. And I have to say that I don't know the answer
to that one. I'm not sure why you would want any of the other combinations of settings; perhaps 
there are countries where the tax rules states that discounts may not be taxed?. Otherwise I 
wouldn't know why you would ever any of those other combinations.

So... when in doubt: always use _'Apply Tax after discount / apply discount on prices including tax'_,
and otherwise you'd better be well aware of what you're doing. And oh yeah: share with us your use
case on why you need a different setting.