'use strict';

/**
 * @ngdoc overview
 * @name vangularApp
 * @description
 * # vangularApp
 *
 * Main module of the application.
 */
angular
  .module('angularTubeApp', [
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
