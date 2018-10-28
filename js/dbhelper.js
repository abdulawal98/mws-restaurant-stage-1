//import idb from 'idb';
/**
 * Common database helper functions.
 */
class DBHelper {



/**
 * IDB Codes.
 */



/**
   * Opens Idb
   */
   
   static openIdb() {
    var dbPromise = idb.open('offlineIdb', 10, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
          var dbStore = upgradeDb.createObjectStore('restaurantsStore', {keyPath: 'id'});
        case 1:
         var reviewsStore = upgradeDb.createObjectStore('reviewsStore', {keyPath: 'id'});
         reviewsStore.createIndex('restaurantId', 'restaurant_id');
        
      }
    });
    return dbPromise;
}


static writeReviewsToIdb(data) {    

    console.log("Inside writeReviewsToIdb,  JSON: ", data);
    writeToDb(data);

    function writeToDb(data) {
      DBHelper.openIdb().then(function(db){
        if (!db) return;
        var tx = db.transaction('reviewsStore', 'readwrite');
        var reviewsStore = tx.objectStore('reviewsStore');
        var restaurantIndex = reviewsStore.index('restaurantId');
        data.forEach(record => reviewsStore.put(record));
        return tx.complete;
      }).then(function() {
        console.log('Success Writting Reviews to Database!');
      });
    }
}





  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

   

static fetchReviewByRestaurantId(id,callback){
   const port = 1337 // Change this to your server port
  var fetchURL = `http://localhost:${port}/reviews/?restaurant_id=${id}`;

  //fetchURL = DBHelper.REVIEW_URL(id);
  console.log("fetchReviewByRestaurantId, url " + fetchURL);

    if(navigator.onLine) {

      fetch(fetchURL, { method: 'GET' })
          .then(response => {        
            response.json().then(reviews => {
              console.log("reviews JSON: ", reviews);
              DBHelper.writeReviewsToIdb(reviews);
              callback(null, reviews);
            });
          })
          .catch(error => {
            callback(`Request failed. Returned ${error}`, null);
          });

       }else{
              //Offline review will come from idb
                DBHelper.openIdb().then(function(db){
                if(!db) return;
                var tx = db.transaction('reviewsStore');
                var reviewsStore = tx.objectStore('reviewsStore');

                return reviewsStore.getAll();
              }).then(function(reviews){
                callback(null, reviews);
                console.log('Data fetched from idb');
              })

       }   


  
}//End of function fetchReviewByRestaurantId


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback,id) {
    
     let fetchURL;
    if (!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + '/' + id;
    }


    fetch(fetchURL, { method: 'GET' })
      .then(response => {        
        response.json().then(restaurants => {
          console.log("restaurants JSON: ", restaurants);
          callback(null, restaurants);
        });
      })
      .catch(error => {
        callback(`Request failed. Returned ${error}`, null);
      });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  

   
  
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   Make restaurant favourite or unfavourite
  */



  static makeRestaurantFavourite(restaurantId,isFavourite){

  	// `http://localhost:${port}/restaurants`;
    //restaurant.is_favorite = isFavourite;

  console.log('Change isFavourite to ' + isFavourite);
  var url =  `http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavourite}`;
  console.log(url);

   fetch(url,{
   	method : 'PUT'
   })
   .then(() => {
     	console.log('Updated isFavourite status');
     	this.dbPromise()
     	.then(db => {
     	 console.log('Updated isFavourite status2');	
       const transaction =  db.transaction('restaurants','readwrite');
       const objStore = transaction.objectStore('restaurants');
       console.log('transaction ' + transaction);
       objStore.get(restaurantId)
       .then(restaurant => {
       	restaurant.is_favorite = isFavourite;
       	objStore.put(restaurant);

     });

   	})//End of then

   }


   	)//end of then
  

  }//end of function makeRestaurantFavourite





}
