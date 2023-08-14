import {
    hooks
} from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import utils from '@bigcommerce/stencil-utils';
import {
    createTranslationDictionary
} from '../theme/common/utils/translations-utils';
import {
    showAlertModal, defaultModal
} from './global/modal';

const CARTS_ENDPOINT = "/api/storefront/carts/";
const ADDED_TO_CART = "Product(s) added to cart";

function getHeaders() {
    return {
        'Content-Type': 'application/json',
    };
}

function setImageSource(e, attributeName) {
    const card = $(e.currentTarget).find(".card-image");
    const image = card.attr(attributeName);
    card.attr("srcset", image);
}

function fetchCart(route) {
    return fetch(route, {
            method: "GET",
            credentials: "same-origin"
        })
        .then(response => response.json())
        .catch(error => console.error(error));
}

function checkCart() {
    fetchCart(CARTS_ENDPOINT)
        .then((result) => {
           
            if (result.length > 0) {
                $('[data-button-type="remove-all"]').css("display", "block");
            } else {
                $('[data-button-type="remove-all"]').css("display", "none");
            }
        })
        .catch(error => console.error(error));
}

// Update cart with new line items handling case where product has
async function updateCart(cart, lineItems) {
    let cartQuantity = 0;
    // account for all types of items
    const allItems = [...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems, ...cart.lineItems.customItems, ...cart.lineItems.giftCertificates];

    // Calculate cart quantity, for the sake of not making another request we add +1 here. If the quantity is wrong, it will be corrected on the next page load
    allItems.forEach(item => {
        cartQuantity += item.quantity + 1;
    });

    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({  
            lineItems,
            "locale": "en"
        })
    };

    await fetch(CARTS_ENDPOINT + cart.id + '/items', options)
        .then(response => {
            if (!response.ok) throw new Error('Failed to update cart');
        })
        .then(response => utils.hooks.emit('cart-item-add', response));

    $('body').trigger('cart-quantity-update', cartQuantity);
    $('[data-button-type="remove-all"]').css("display", "block");

showAlertModal(ADDED_TO_CART, {
    icon: '',
});

}

function createCart(lineItems) {
    const createCartQuantity = lineItems.length;
    const options = {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            lineItems
        })
    };

    fetch(CARTS_ENDPOINT, options)
        .then(response => {
            if (!response.ok) throw new Error('Failed to create cart');
            return response.json();
        })
        .then(response => utils.hooks.emit('cart-item-add', response));
    $('[data-button-type="remove-all"]').css("display", "block");
    $('body').trigger('cart-quantity-update', createCartQuantity);
    showAlertModal(ADDED_TO_CART, {
    icon: '',
});
}


export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    bindEvents() {
        $(".card-figure").on({
            mouseenter: this.onMouseEnter.bind(this),
            mouseleave: this.onMouseLeave.bind(this)
        });
        $('[data-button-type="add-all"]').on("click", this.addAllToCart.bind(this));
        $('[data-button-type="remove-all"]').on("click", this.deleteCart.bind(this));
        
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


    async addAllToCart(event) {
        event.preventDefault();
        try {
            // Fetch cart
            const cart = await fetch(CARTS_ENDPOINT).then(response => response.json());

            // Filter products without options and map them to lineItems
            // Handling case where a product has options a better way would be to prompt the user to select the options
            const lineItems = this.context.categoryProducts
                .filter(product => !product.has_options)
                .map(product => ({
                    productId: product.id,
                    quantity: product.qty_in_cart + 1
                }));

            // Check if there is an existing cart or a new one needs to be created
            if (cart.length > 0) {
                await updateCart(cart[0], lineItems);
                
            } else {
                await createCart(lineItems);
                
            }
        } catch (err) {
            console.error("error", err);
        }
    }

    deleteCart(event) {
        event.preventDefault();
        var string = "Are you sure you want to delete your cart?";
        return showAlertModal(string, { // Make sure to return the entire chain
            icon: 'warning',
            showCancelButton: true,
            onConfirm: () => {
                return fetchCart(CARTS_ENDPOINT)
                    .then((result) => {
                        const cartId = result[0].id;
                        return fetch(CARTS_ENDPOINT + cartId, {
                                method: "DELETE",
                                credentials: "same-origin",
                            })
                            .then(response => {
                                utils.hooks.emit('cart-item-remove', response)
                                if (response.ok) {
                                    $('[data-button-type="remove-all"]').css("display", "none");
                                    $('body').trigger('cart-quantity-update', 0); // Triggering the event directly

                                } else {
                                    return showAlertModal(response.data.errors.join('\n'));
                                }
                            })
                    })
                    .catch(error => console.error(error));
            },
        });
    }

    onReady() {
        this.arrangeFocusOnSortBy();
        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));


        this.bindEvents();
        checkCart();
        this.ariaNotifyNoProducts();
    }

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