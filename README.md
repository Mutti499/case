# Welcome to my code for beije case!

In this code I have written a system which creates User, adds new Address to user and collects shopping cart data and prepares orders for users with a one-time or subscription system.

To make monthly orders cron has been used. Every day, customers' subscriptions are checked and orders are given according to the subscriptions that are due.
When the subscription expires, the person's subscription is deleted.

Routes are organized in necessary folders. I used Express, mongoose and stripe in my code.
