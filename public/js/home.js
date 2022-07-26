const setupSlidingEffect=()=>{
    const productContainer=[...document.querySelectorAll('.product-container')];
    const nxtBtn=[...document.querySelectorAll('.nxt-btn')];
    const preBtn=[...document.querySelectorAll('.pre-btn')];
    
    
    productContainer.forEach((item,i)=>{
        let containerDimentions=item.getBoundingClientRect();
        let containerWidth=containerDimentions.width;
    
        nxtBtn[i].addEventListener('click', ()=>{
            item.scrollLeft += containerWidth;
        })
        preBtn[i].addEventListener('click', ()=>{
            item.scrollLeft -= containerWidth;
        })
    
    })
}



//fetch product cards

const getProducts=(tags)=>{
    return fetch('/get-products',{
        method: 'post',
        headers: new Headers({'Content-Type':'application/json'}),
        body:JSON.stringify({tags: tags})
    })
    .then((res)=>res.json())
    .then(data=>{
       console.log(data)
        return data;
    })
}

//create product slider container-for-card-slider
const createProductSlider=(data,parent,title)=>{
debugger

    let slideContainer=document.querySelector(`${parent}`);
    slideContainer.innerHTML += `
        <section class="product">
            <h2 class="product-category">${title}</h2>
            <button class="pre-btn"><img src=".././images/img/arrow.png" alt=""></button>
            <button class="nxt-btn"><img src=".././images/img/arrow.png" alt=""></button>
            ${createProductCards(data)}
        </section>
    `;
    setupSlidingEffect();
}

const createProductCards=(data,parent)=>{
    //here parent is for search products

    let start='<div class="product-container">';
    let middle='';
    let end='</div>';

    for(let i=0 ; i < data.length; i++){
        if(data[i].id != decodeURI(location.pathname.split('/').pop())){
            middle += `
            <div class="product-card">
                <div class="product-image">
                    <span class="discount-tag">${data[i].discount}% off</span>
                    <img src='${data[i].images}' class="product-thumb" alt="">
                    <button class="card-btn">add to whislist</button>
                </div>
                <div class="product-info" onclick="location.href = '/products/${data[i].id}'">
                    <h2 class="product-brand">${data[i].name}</h2>
                    <p class="product-short-des">${data[i].shortDes}</p>
                    <span class="price">Rs.${data[i].sellPrice}</span>
                    <span class="actual-price">Rs.${data[i].actualPrice}</span>
                </div>
            </div>
        ` 
        }
    }
    if(parent){
        let cardContainer=document.querySelector(parent);
        cardContainer.innerHTML = start + middle + end;
    }else{
        return start + middle + end ;
    }
    
}
const add_product_to_card_or_wishlist =(type,product)=>{
    let data= JSON.parse(localStorage.getItem(type));
    if(data==null){
        data=[];
    }

    product={
        item:1,
        name:product.name,
        sellPrice:product.sellPrice,
        size:size || null,
        shortDes:product.shortDes,
        image:product.images[0],
    }
    data.push(product);
    localStorage.setItem(type,JSON.stringify(data));
    return 'added';
}