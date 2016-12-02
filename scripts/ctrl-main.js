'use strict';

angular.module('angularTubeApp', ['ngRoute'])  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
  }).config( 
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
    })
.filter('filmSearch', function(){

  return function(items, s){
    var filtered = [];

    var foundBy = {
        cast:false,
        title:false,
        tag:false,
        duration:false,
        later:false,
        unwatched:false,
        new:false
      }

    var found = false;
    var failed = false;

    if (s.title == "" && s.hide == "" && s.duration.min == 0 && s.cast.length== 0 && s.tags.length==0 && s.later == false && s.unwatched == false && s.new == false) {
      //No Filters are Set, Return a slice of the entire array.
      console.log("No Filters Set");
      return items.slice(s.perPage * s.page, s.perPage * s.page + s.perPage);
    };

    for (var i = items.length - 1; i >= 0; i--) {

      foundBy = {
        cast:false,
        title:false,
        tag:false,
        duration:false,
        later:false,
        unwatched:false,
        new:false
      }

      found = false;
      failed = false;

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

        if (s.unwatched == true) {
          if (typeof(items[i].watched) === "undefined" || items[i].watched < 1) {
            foundBy.unwatched = true;
            found = true;
            //console.log("passed unwatched test.")
          } else {
            failed = true;
            //console.log("FAILED unwatched test.")
          }
        } else {
          //console.log("not testing on unwatched.")
        }

        if (s.new == true) {
          if (items[i].mtime > (Date.now()/1000) - (60*60*24*7)) { //one week
            foundBy.new = true;
            found = true;
            //console.log("passed New test.")
          } else {
            failed = true;
            //console.log("FAILED new test.")
          }
        } else {
          //console.log("not testing on new.")
        }

        //console.log("New test complete.")

      //Title Search
      if (s.title.length > 0) {
        if (items[i].title.toLowerCase().indexOf(s.title.toLowerCase()) > -1) {
          found = true;
          foundBy.title = true;
          //console.log("["+i+"]"+"Found by title");
        } else {
          failed = true;
        }
      };

      //Hide Search
      if (s.hide.length > 0) {
        var hiddenTerms = s.hide.split(" ");
        for (var termy = hiddenTerms.length - 1; termy >= 0; termy--) {
          if (
              items[i].title.toLowerCase().indexOf(hiddenTerms[termy].toLowerCase()) > -1
              ||
              items[i].path.toLowerCase().indexOf(hiddenTerms[termy].toLowerCase()) > -1
          ) {
            failed = true;
          } else {
            found = true;
          }
        }
      };

      //Cast Search
      //
/*
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

*/
      //check duration
      if (s.duration.min != 0 && s.duration.min*60 < items[i].duration){  
          found = true;
          foundBy.duration = true;
          //console.log("["+i+"]"+" Found by Duration");
      }

      
      if(  
          (s.title != ""     && foundBy.title == false) ||
          //(s.tags.length > 0 && foundBy.tag  == false)   ||
          //(s.cast.length > 0 && foundBy.cast == false)   || 
          (s.duration.min > 0 && foundBy.duration == false) ||
          (s.later === true && foundBy.later == false)||
          (s.unwatched === true && foundBy.unwatched == false)||
          (s.new === true && foundBy.new == false)
        )
      {
        failed = true;
          //console.log("["+i+"]"+" Failed the final checks");
      }
      //Final Check
      if (found && !failed){
        filtered.push(items[i])
      }

    };
    if (filtered.length > 0) {
      return filtered.slice(s.perPage * s.page, s.perPage * s.page + s.perPage);
    }
    return false;
  }
})

   .controller('MainCtrl', ['$scope', 'filmSearchFilter', '$interval', '$http', '$anchorScroll', '$location', 
    function ($scope, filmSearchFilter, $interval, $http, $anchorScroll, $location) {

        $scope.debug = false; //Switch to True to show a <pre> with current variable values 

        $scope.advancedFilters = false;

        $scope.s = {
          title:'',
          hide:'',
          cast:[],
          tags:[],
          castMatch:-1,
          tagMatch:-1,
          duration : {min:0},
          later:false,
          unwatched:false,
          new:false,
          perPage:12,
          page:0
        }


        $scope.f = {
          title:'',
          hide:'',
          cast:[],
          tags:[],
          castMatch:-1,
          tagMatch:-1,
          duration : {min:0},
          later:false,
          unwatched:false,
          new:false,
          perPage:12,
          page:0
        }

        $scope.perRow = 2;
        $scope.perRowOption = 3;

        $scope.togglePerRow = function(){
          var tempShow = $scope.perRow;
          $scope.perRow = $scope.perRowOption;
          $scope.perRowOption = tempShow;
        }

  $scope.applyFilter = function(){
    $scope.s.title          = $scope.f.title;
    $scope.s.hide           = $scope.f.hide;
    $scope.s.cast           = $scope.f.cast;
    $scope.s.tags           = $scope.f.tags;
    $scope.s.castMatch      = $scope.f.castMatch;
    $scope.s.tagMatch       = $scope.f.tagMatch;
    $scope.s.duration.min   = $scope.f.duration.min;
    //$scope.s.later          = $scope.f.later;
    //$scope.s.unwatched      = $scope.f.unwatched;
    //$scope.s.new            = $scope.f.new;
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


  $scope.shuffleDB = function(){
    $scope.shuffle($scope.filmDB);
  }

  $http.get('./db/filmDB.json')
    .then(function(res) {
        $scope.filmDB = res.data;
        $scope.shuffle($scope.filmDB);
    }, function errorCallback(response) {
    console.log(response);
    console.log("Error loading json.");
  });

  $http.get('./scripts/tag-wizard.json')
    .then(function(res) {
        $scope.tagWizard = res.data;
    }, function errorCallback(response) {
    console.log("Error loading tag-wizard.json. ");
    console.log(" If you want " +
                "to take advantage of this feature, copy the " +
                "tag-wizard-example.json to tag-wizard.json " + 
                "and modify as desired.");
  });

  $scope.startScreenPreview = function(filmid){

    $interval.cancel($scope.intervalPromise);
    var i = 0;
    var shotsLength = $scope.filteredDB[filmid].sshot_count;
    //var shots = $scope.filteredDB[filmid].sshot;
    $scope.intervalPromise = $interval(function(){
      i = i + 1;

      if (i == shotsLength) {
        i = 0;
      };
      $scope.filteredDB[filmid].currentScreenshot = (i+1);
      //$scope.currentScreenshot = $scope.filteredDB[filmid].currentScreenshot; 
    }, 500);
  }

  $scope.setEdit = function(filmid){
    $scope.editItem = filmid;
    //console.log(filmid);
  }

  $scope.stopScreenPreview = function(filmid){
    $interval.cancel($scope.intervalPromise);
    $scope.filteredDB[filmid].currentScreenshot = 1;
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
      $scope.status = text;
      //former hardcoded fix for my personal server.
  }

  $scope.shuffle = function(o) {
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  }

  $scope.singleFilePlaylist = function(filmURL){
    return encodeURI('data:audio/mpegurl;charset=utf-8,'+filmURL);
  }

  $scope.playlist = [];

  $scope.addToPlaylist = function(fileURL){
    $scope.playlist.push(fileURL);
    var playlistContent = "data:audio/mpegurl;charset=utf-8,";
    for (var i = 0; i < $scope.playlist.length; i++) {
      playlistContent += $scope.playlist[i] + "\n"; 
    }
    $scope.playlistURI = encodeURI(playlistContent);
  }

  $scope.playlistURI = "#";

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

  $scope.setToggleTag = function(tagValue,filmid){
    console.log("toggling tags for "+$scope.filmDB[filmid].title)
    //console.log("Passed tagValue:"+tagValue)
    //console.log("Passed filmid:"+filmid)
    if ($scope.filteredDB[filmid].tags.includes(tagValue)) {
      //console.log("it's in the tags already");
      var index = $scope.filteredDB[filmid].tags.indexOf(tagValue);
      $scope.filteredDB[filmid].tags.splice(index, 1);     
    } else {
      //console.log("not in tags yet");
      $scope.filteredDB[filmid].tags.push(tagValue);
    }
    $scope.$apply();
  }


    
   
  }]);