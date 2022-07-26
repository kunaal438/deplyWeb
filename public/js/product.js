const productImages = document.querySelectorAll(".product-images img");
const productImageSlide = document.querySelector(".image-slider");

let activeImageSlide = 0;

productImages.forEach((item, i) => {
    item.addEventListener('click', () => {
        productImages[activeImageSlide].classList.remove('active');
        item.classList.add('active');
        productImageSlide.style.backgroundImage = `url('${item.src}')`;
        activeImageSlide = i;
    })
})

//toggle size buttons

const sizeBtns = document.querySelectorAll('.size-radio-btn');
let checkedBtn = 0;
let size;
sizeBtns.forEach((item, i) => {
    item.addEventListener('click', () => {
        sizeBtns[checkedBtn].classList.remove('check');
        item.classList.add('check')
        checkedBtn = i;
        size=item.innerHTML;
    })
})

const setData = (data) => {
    let title = document.querySelector('title');

    //set the images
    productImages.forEach((img,i)=>{
        if(data.images[i]){
            img.src=data.images[i];
        }else{
            img.style.display='none';
        }
    })
    productImages[0].click();

    //set up sizes
    sizeBtns.forEach(item => {
        if (!data.sizes.includes(item.innerHTML)) {
            item.style.display = 'none';
        }
    })

    //settings up texts

    const name = document.querySelector('.product-brand');
    const shortDes = document.querySelector('.product-short-des');
    const des = document.querySelector('.des');

    title.innerHTML += name.innerHTML = data.name;
    shortDes.innerHTML = data.shortDes;
    des.innerHTML = data.des;

    //pricings

    const sellPrice = document.querySelector('.product-price');
    const actualPrice = document.querySelector('.product-actual-price');
    const discount = document.querySelector('.product-discount');

    sellPrice.innerHTML = `${data.sellPrice}`
    actualPrice.innerHTML = `${data.actualPrice}`
    discount.innerHTML = `( ${data.discount}% off )`

    //wishlist and card btn
    const wishlistBtn= document.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click',()=>{
        wishlistBtn.innerHTML=add_product_to_card_or_wishlist('wishlist',data);
    })

    const cartBtn= document.querySelector('.cart-btn');
    cartBtn.addEventListener('click',()=>{
        cartBtn.innerHTML=add_product_to_card_or_wishlist('cart',data);
    })
}

const fetchProductData = () => {
    fetch('/get-products', {
        method: 'post',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id: productId })
    })
        .then((res) => res.json())
        .then(data => {
            console.log(data)
            setData(data);
            getProducts(data.tags[1]).then(data => createProductSlider(data, '.container-for-card-slider',
             'similar products'))
        })
        .catch(err => {
            location.replace('/404');
        })
}

let productId = null;
if (location.pathname != '/products') {
    productId = decodeURI(location.pathname.split('/').pop());
    fetchProductData();
}
