let restaurant;
var map;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = 'Restaurant image';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
 
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  var reviews2;

  //Need to call review API
  console.log("Inside review , restaurant id "  + self.restaurant.id);
  
  
  DBHelper.fetchReviewByRestaurantId(self.restaurant.id, (error, reviews) => {
      
      //callback(null, restaurant)
       reviews2 = reviews;

        if (!reviews2) {
          const noReviews = document.createElement('p');
          noReviews.innerHTML = 'No reviews yet!';
          container.appendChild(noReviews);
          return;
        }
     

       const ul = document.getElementById('reviews-list');
       reviews2.forEach(review => {
        ul.appendChild(createReviewHTML(review));
       });
        container.appendChild(ul);


    });



 

  //it is move to up
 
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}


createReviewHTMLOffline = (review) => {
  const ul = document.getElementById('reviews-list');
  console.log("In createReviewHTMLOffline method");
  const li = document.createElement('li');
  li.style.backgroundColor = 'red';
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  ul.prepend(li);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
Add restaurant review
*/
addReview = () => {

  //alert("In review");
  //event.preventDefault();
  //var url = 'http://localhost:1337/reviews/';

  let restaurantId = getParameterByName('id');
  let name = document.getElementById('review-author').value;
  var selectR = document.getElementById('select_rating');
  let rating = selectR.options[selectR.selectedIndex].text;
  let comments = document.getElementById('review-comments').value;

  console.log("restaurantId " + restaurantId);
  console.log("name " + name);
  console.log(rating);
  const review = {
    "restaurant_id": restaurantId,
    "name": name,
    "rating": rating,
    "comments": comments
              };

//Offline functionality
if(!navigator.onLine){

  console.log("Off line mode while saving review");
  //Add the review html in UI in offline mode
  createReviewHTMLOffline(review);
  saveDataWhenGetOnline(review);
  return;
}

 
  saveReviewData(review);


  //window.location.reload(true);

}//End of add review function


saveReviewData = (reviewData) => {

   console.log("Inside saveReviewData,  reviewData = " + reviewData);
   var url = 'http://localhost:1337/reviews/';

  fetch(url, {
  method: 'post',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reviewData)
}).then(res=>res.json())
  .then(res => {
    console.log(res);
    window.location.reload(true);
  });


}// End of function saveReviewData




saveDataWhenGetOnline = (reviewObject) => {
  console.log("Inside saveDataWhenGetOnline,  reviewObject = " + reviewObject);
  localStorage.setItem('reviewData',JSON.stringify(reviewObject));

  window.addEventListener('online',(event) => {
    console.log("Becomes online again");
    let offlineData = JSON.parse(localStorage.getItem('reviewData'));
    if(offlineData !=null){
      console.log("Offline data " + offlineData);
      saveReviewData(offlineData);
       console.log("Offline data sent to API ");
    }

    localStorage.removeItem('reviewData');
    console.log("Remove local storage data");
  });//End of addEventListener



}//End of saveDataWhenGetOnline function