'use strict';

angular.module('angularTubeApp')

   .controller('MainCtrl', ['$scope', '$interval', '$http', '$anchorScroll', '$location', 
    function ($scope, $interval, $http, $anchorScroll, $location) {

        $scope.debug = false; //Switch to True to show a <pre> with current variable values 

        $scope.advancedFilters = false;

        $scope.s = {
          cast:[],
          tags:[],
          castMatch:-1,
          tagMatch:-1,
          perPage:12,
          page:0,
          duration : {min:0}
        }

        $scope.f = {
          cast:[],
          tags:[],
          title:"",
          castMatch:-1,
          tagMatch:-1,
          duration : {min:0}
        }

  $scope.applyFilter = function(){
    $scope.s.title          = $scope.f.title;
    $scope.s.cast           = $scope.f.cast;
    $scope.s.tags           = $scope.f.tags;
    $scope.s.castMatch      = $scope.f.castMatch;
    $scope.s.tagMatch       = $scope.f.tagMatch;
    $scope.s.duration.min   = $scope.f.duration.min;
    $scope.$apply();
  }

  $scope.scrollToTop = function() {
    $location.hash('MeatAndPotatos');
    $anchorScroll();
  };

$scope.remove = function(tagText, tagListID) { 
  var newTagArray = [];
  console.log("Looking through tags.")
  console.log($scope.fetchedTags[tagListID])
  $.each($scope.fetchedTags[tagListID], function( index, value ) {
    console.log("Comparing '"+value+"'' and '"+tagText+"'");
    if (value != tagText) {
      console.log("Pushing.");
      newTagArray.push(value);
    }  else {
      console.log("Not Pushing.");
    }
  });
  console.log("below is our new tag list!");
  console.log(newTagArray);
  $scope.fetchedTags[tagListID] = newTagArray;    
}

$scope.getTags = function(fileName, filmid){
      fileName = fileName.substring(fileName.lastIndexOf("/") + 1);
   $http.get('file.php?f='+fileName)
      .then(function(res) {
          console.log(res.data);
          $scope.filmDB[filmid].tags = res.data;
          $scope.fetchedTagsForFilm = filmid;
          $scope.fetchedTags = res.data;
          $('#tagModal').modal('show');
      }, function errorCallback(response) {
      console.log("Error loading tags.");
    });
};



  $http.get('./db/filmDB.json')
    .then(function(res) {
        $scope.filmDB = res.data;
        $scope.shuffle($scope.filmDB);
    }, function errorCallback(response) {
    console.log(response);
    console.log("Error loading json.");
  });


  $scope.debug = true;

  $scope.startScreenPreview = function(filmid){

    $interval.cancel($scope.intervalPromise);
    var i = 0;
    var shotsLength = $scope.filteredDB[filmid].sshot.length;
    var shots = $scope.filteredDB[filmid].sshot;
    $scope.intervalPromise = $interval(function(){
      i = i + 1;

      if (i == shotsLength) {
        i = 0;
      };

      $scope.filteredDB[filmid].currentScreenshot = shots[i];
      $scope.currentScreenshot = shots[i]; 
    }, 500);
  }
  $scope.setEdit = function(filmid){
    $scope.editItem = filmid;
    //console.log(filmid);
  }

  $scope.stopScreenPreview = function(filmid){
    $interval.cancel($scope.intervalPromise);
    $scope.filteredDB[filmid].currentScreenshot = $scope.filteredDB[filmid].sshot[0];
  }
  
  $scope.pushCast = function(castMember){
    var temp = [castMember];
    $scope.s.cast = $scope.s.cast.concat(temp);
  }
  
  $scope.pushTag = function(tag){
    var temp = [tag];
    $scope.s.tags = $scope.s.tags.concat(temp);
  }

  
  $scope.saveDB = function() {
      $http.post('filmDB.php', $scope.filmDB);
  }
  $scope.setStatus = function(text) {
      $scope.status = text.replace('/media/mephesto/Azul/porn','').replace('/media/mephesto/Scarlett','');
  }

  $scope.shuffle = function(o) {
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  }

  $scope.filmDuration = function(fD) {
          if (fD < 1) return "";
          var t = {};
          t.h = Math.floor(fD / 3600);
          t.m = Math.floor(fD / 60) % 60;
          t.s = fD % 60;
          if (t.h > 0)
              return t.h + "h " + t.m + "m " + t.s + "s"
          if (t.m > 0)
              return t.m + "m " + t.s + "s"
          return t.s + "s";
      }


    
   
  }]).filter('filmSearch', function(){
  return function(items, s){
    var filtered = [];
    var foundBy = {cast:false,title:false,tag:false,duration:false,later:false};
    var found = false;
    var failed = false;


    if (s.title == "" && s.duration.min == 0 && s.cast.length== 0 && s.tags.length==0 && s.later == false) {
      //console.log(s);
      return items.slice(s.perPage * s.page, s.perPage * s.page + s.perPage)
    };

    for (var i = items.length - 1; i >= 0; i--) {
      foundBy = {cast:false,title:false,tag:false,duration:false,later:false}
      found = false;
      failed = false;

        //console.log("before later test.")
        if (s.later == true) {
          if (items[i].later === true) {
            foundBy.later = true;
            found = true;
            //console.log("passed Later test.")
          } else {
            failed = true;
            //console.log("FAILED later test.")
          }
        } else {
            //console.log("not testing on later.")
        }

        //console.log("after later test.")

      //Title Search
      if (s.title.length > 0 && items[i].title.toLowerCase().indexOf(s.title.toLowerCase()) > -1) {
        found = true;
        foundBy.title = true;
        //console.log("["+i+"]"+"Found by title");
      };

      //Cast Search
      //

      for (var j = items[i].cast.length - 1; j >= 0; j--) {
        for (var k = s.cast.length - 1; k >= 0; k--) {
          //console.log("gonna compare -" + items[i].cast[j].toLowerCase() + "- and -" + s.cast[k].toLowerCase() + "-")
          if (items[i].cast[j].toLowerCase().indexOf(s.cast[k].toLowerCase()) > -1){
            found = true;
            foundBy.cast = true;
            //console.log("["+i+"]"+" found by cast ------ "+ items[i].cast[j].toLowerCase() + "- and -" + s.cast[k].toLowerCase() + "-");
          }
        };

      };

      
      //Tag Search
      //


      for (var j = items[i].tags.length - 1; j >= 0; j--) {
        for (var k = s.tags.length - 1; k >= 0; k--) {
          //console.log("gonna compare -" + items[i].cast[j].toLowerCase() + "- and -" + s.cast[k].toLowerCase() + "-")
          if (items[i].tags[j].toLowerCase().indexOf(s.tags[k].toLowerCase()) > -1){
            found = true;
            foundBy.tag = true;
            //console.log("["+i+"]"+" found by tags ------ "+ items[i].tags[j].toLowerCase() + "- and -" + s.tags[k].toLowerCase() + "-");
          }
        };

      };


      //check duration
      if (s.duration.min != 0 && s.duration.min*60 < items[i].duration){  
          found = true;
          foundBy.duration = true;
          //console.log("["+i+"]"+" Found by Duration");
      }

      
      if(  
          (s.title != ""     && foundBy.title == false) ||
          (s.tags.length > 0 && foundBy.tag  == false)   ||
          (s.cast.length > 0 && foundBy.cast == false)   || 
          (s.duration.min > 0 && foundBy.duration == false) ||
          (s.later === true && foundBy.laster == false)
        )
      {
        failed = true;
          //console.log("["+i+"]"+" Failed the final checks");
      }
      //Final Check
      if (found && !failed){
        filtered.push(items[i])
        //console.log(foundBy);
          //console.log("["+i+"]"+" Passed the final checks");
          //console.log(items[i])
      }

    };
    if (filtered.length > 0) {
      return filtered.slice(s.perPage * s.page, s.perPage * s.page + s.perPage);
    }
    return false;
  }
});
