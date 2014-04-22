angular.module( 'core9Dashboard.refman', [
  'core9Dashboard.refman.app',
  'templates-module-platform-reference-manager'
  ])

;

angular.module('core9Dashboard.admin.dashboard').requires.push('core9Dashboard.refman');