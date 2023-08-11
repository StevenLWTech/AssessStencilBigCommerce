import {
    hooks
} from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import {
    createTranslationDictionary
} from '../theme/common/utils/translations-utils';
import {
    showAlertModal
} from './global/modal';
const CARTS_ENDPOINT = "/api/storefront/carts/";

function setImageSource(e, attributeName) {
    const card = $(e.currentTarget).find(".card-image");
    const image = card.attr(attributeName);
    card.attr("srcset", image);
}

function fetchCart(route) {
    return fetch(route, {
            method: "GET",
            credentials: "same-origin",
        })
        .then((response) => response.json())
        .catch((error) => console.error(error));
}

function updateCartDisplay(length) {
    var elements = document.getElementsByClassName('data-delete-cart');

    if (elements.length > 0) { 
        var element = elements[0]; 
        if (length > 0) {
            element.style.display = "block";
        } else {
            element.style.display = "none";
        }
    } else {
        console.error('Elements with class "data-delete-cart" not found');
    }
}


function getCart(route) {
    return fetchCart(route).then((result) => {
        var length = result.length;
        updateCartDisplay(length);
        return result;
    });
}

function deleteCart() {
    var string = "Are you sure you want to delete your cart?"
    showAlertModal(string, {
        icon: 'warning',
        showCancelButton: true,
        onConfirm: () => {

            return fetchCart(CARTS_ENDPOINT)
                .then((result) => {
                    // Assuming the cart ID is in the first item in the result array
                    const cartId = result[0].id;


                    // Making the delete request with the cartId
                    return fetch(CARTS_ENDPOINT + cartId, {
                            method: "DELETE",
                            credentials: "same-origin",
                        })
                        .then(response => {
                            if (response.ok) {
                                updateCartDisplay(0);
                                return;
                            } else {
                                throw new Error('Failed to delete cart');
                            }
                        })
                })
                .catch(error => console.error(error));
        },
    });
}

function addAllProductsToCart(productIds) {
    function addToCart(productId) {
        return $.get("/cart.php?action=add&product_id=" + productId)
            .done(function (data) {
                updateCartDisplay(data.length);
            })
            .fail(function (xhr, status, error) {
                throw new Error('Failed to add product ' + productId + ' to the cart: ' + error);
            });
    }

    // Chain the promises to add each product to the cart in sequence
    return productIds.reduce(function (promise, id) {
        return promise.then(function () {
            return addToCart(id);
        });
    }, Promise.resolve());
}

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }


    onMouseEnter(e) {
        setImageSource(e, "data-hover-image");
    }

    onMouseLeave(e) {
        setImageSource(e, "data-src");
    }


    onReady() {
        this.arrangeFocusOnSortBy();
        getCart(CARTS_ENDPOINT);

        $('.data-delete-cart').on('click', () => {

            deleteCart();
        });

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        $(".card-figure").on({
            mouseenter: this.onMouseEnter.bind(this),
            mouseleave: this.onMouseLeave.bind(this)
        });

        $(".addAllToCart").on("click", function () {
         
            var productIdsString = $(this).attr("data-product-list");
            var productIds = JSON.parse(productIdsString);

            addAllProductsToCart(productIds)
                .then(function () {
                    showAlertModal('All items have been added to the cart.', {
                        icon: 'success'
                    });
                })
                .catch(function (error) {
                    showAlertModal('An error occurred: ' + error.message, {
                        icon: 'error'
                    });
                    console.error(error);
                });
        });




        // $(".addAllToCart").on("click", function () {
        //     var product_ids_string = $(this).attr("data-product-list");
        //     var product_ids = JSON.parse(product_ids_string); // Parse the JSON string into an array

        //     // Map the product IDs into an array of line items
        //     var lineItems = product_ids.map(function (id) {
        //         return {
        //             quantity: 1,
        //             productId: id
        //         };
        //     });


        //     getCart('/api/storefront/carts?include=lineItems.digitalItems.options,lineItems.physicalItems.options')
        //         .then(data => {
        //             if (data.length === 0) {
        //                 createCart('/api/storefront/carts', {
        //                         lineItems
        //                     })
        //                     .then(newCartData => {
        //                         addItemsToCart(newCartData.id);
        //                     })
        //                     .catch(error => {
        //                         console.error("An error occurred when creating the cart:", error);
        //                     });
        //             } else {
        //                 addItemsToCart(data[0].id);
        //             }
        //         });

        //     function addItemsToCart(cartId) {
        //         addCartItem('/api/storefront/carts/', cartId, {
        //                 lineItems
        //             }) // Wrap lineItems inside an object
        //             .then(response => response.json()
        //                 .then(result => console.log("success"))
        //                 .catch(error => {
        //                     console.error("An error occurred:", error);
        //                 }))
        //             .catch(error => {
        //                 console.error("An error occurred:", error);
        //             });
        //     }
        // });

        this.ariaNotifyNoProducts();
    }
    // createCart(route, cartItems) {
    //     return fetch(route, {
    //             method: "POST",
    //             credentials: "same-origin",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(cartItems),
    //         })
    //         .then(response => response.json())
    //         .then(result => console.log(result))
    //         .catch(error => console.error(error));
    // };



    // addCartItem(routeStart, cartId, cartItems) {
    //     var route = routeStart + cartId + '/items';
    //     return fetch(route, {
    //             method: "POST",
    //             credentials: "same-origin",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(cartItems),
    //         })
    //         .then(response => response.json())
    //         .then(result => console.log(result))
    //         .catch(error => console.error(error));
    // };

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}