# Bigcommerce Theme Builder Test (Brief Overview)

**Link**: [Bigcommerce Theme Builder Test](https://bigcommercethemebuildertest.mybigcommerce.com/)  
**Preview Code**: sr4814jalo

I began by acquainting myself with the documentation structure, directory structure, APIs, Stencil, and Handlebars.

## Task 1: Create a Feature to Show the Product's Second Image on Hover
By understanding the directory structure, I located the card.html, which defines how an image is sized using lazy loading in responsive-img. Referring to the documentation, I discovered that getImageSrcset would allow me to return a list of image URLs, enabling me to target an image array.

In the JavaScript, the task boiled down to targeting the Handlebar classes and toggling between two methods.

## Task 2: Add a Button Labeled "Add All To Cart" at the Top of the Category Page
I aimed to align this feature with the theme layout and placed the component in components/category/product_listings -> components/products/add-all-to-cart, based on the route of grid/list. I passed the product IDs through the Handlebar to obtain all the products on the current page. I am optimistic that the pagination will limit the products to the current page, though I haven't tested this for a large product count.

In JavaScript, I initiated by verifying the presence of a cart. If no cart exists, the API creates a cart and enters a quantity of 1 for each product ID. If there is an existing cart, it updates the cart lines instead. I also explored using event hooks to target the cart-quantity and update the cart count.

Issues and Workarounds:

Issue: When updating an item with options, the server requires a variant ID.
Workaround: My solution only added items without options by filtering the list of products.
Alternative Solution #1: Targeting a default variant ID during product creation.
Alternative Solution #2: Prompting users to choose options via product cards or carousels.

### Task 2.1: Notify the User When a Product Has Been Added (If the Cart Has an Item in It)
I utilized a Modal for this task, even though it conflicts with certain documentation guidelines, in order to save time.

## Task 3: Show a "Remove All Items" Button Next to the "Add All To Cart" Button
This task was rather straightforward, involving a simple API call using the cartID.

## Task 4: Display a Customer Details Banner at the Top of the Category Page (If a Customer is Logged In)
This task was also straightforward, especially after completing Task 2.

## Conclusion
Grasping Handlebars, hooks, and understanding how data is passed in this theme took longer than anticipated. However, it was an invaluable learning experience that exposed me to the clean and structured code of Bigcommerce. I am eager for the opportunity to continue working with this codebase.

A post-upload bug discovery revealed an issue when attempting to create a cart without a valid product ID due to the items added having options. Nonetheless, I wanted to ensure this assessment was submitted on a reasonable time.
