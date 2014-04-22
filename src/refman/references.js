angular.module('core9Dashboard.refman.app', [
	'ui.router',
	'core9Dashboard.menu',
	'core9Dashboard.config',
	'core9Dashboard.content'
  ])

.config(function ($stateProvider) {
  $stateProvider.state( 'contentreferences', {
    url: '/content/references',
    views: {
      "main": {
        controller: 'ContentReferencesCtrl',
        templateUrl: 'c9refman/refman/references.tpl.html'
      }
    },
    data:{ 
		pageTitle: 'Content references',
		sidebar: 'content'
    }
  });
})

.controller('ContentReferencesCtrl', function($scope, ConfigFactory, ContentFactory) {
	$scope.contenttypes = ConfigFactory.query({configtype: 'content'});
	$scope.srcSearch = {};
	$scope.dstSearch = {};
	$scope.unreferenced = false;

	$scope.$watch('unreferenced', function() {
		if($scope.sourceField !== undefined) {
			if($scope.unreferenced) {
				$scope.srcSearch[$scope.sourceField.name] = '!';
			} else {
				delete($scope.srcSearch[$scope.sourceField.name]);
			}
		}
	});

	$scope.getContentRefFields = function(schemaOptions) {
		if(schemaOptions !== undefined) {
			var result = [];
			var items, i;
			for(var field in schemaOptions) {
				if(field === 'widget' && schemaOptions[field] === 'contentref') {
					result.push({name: 'this', field: schemaOptions});
				} else if(typeof(schemaOptions[field]) === 'object') {
					items = $scope.getContentRefFields(schemaOptions[field]);
					for(i = 0; i < items.length; i++) {
						if(items[i].name === 'this') {
							if(field === 'items') {
								items[i].field['qty'] = 'multiple';
							} else {
								items[i].name = field;
							}
						} else {
							items[i].name = field + "." + items[i].name;
						}
						result.push(items[i]);
					}
				}
			}
			return result;
		}
	};

	$scope.reset = function(current, other, index) {
		$scope[other] = {};
		var isActive = $scope[current][index._id];
		$scope[current] = {};
		if(isActive) {
			delete($scope.pivotType);
			delete($scope.pivot);
		} else {
			$scope[current][index._id] = true;
			$scope.pivot = index;
		}
	};

	/* TODO: Only supports multiple items */
	$scope.setSelectedDestItems = function() {
		if($scope.pivot !== undefined) {
			if($scope.pivot[$scope.sourceField.name] === undefined) {
				$scope.pivot[$scope.sourceField.name] = [];
			}
			var field = $scope.pivot[$scope.sourceField.name];
			for(var i = 0; i < field.length; i++) {
				$scope.destIndex[field[i].value] = true;
			}
		}
	};

	$scope.srcIndex = {};
	$scope.selectSource = function(index) {
		if($scope.pivotType === undefined) {
			$scope.pivotType = 'source';
		}
		if($scope.pivotType === 'source') {
			$scope.reset('srcIndex', 'destIndex', index);
			$scope.setSelectedDestItems();
		} else {
			var isActive = $scope.srcIndex[index._id];
			if(isActive) {
				var field = index[$scope.sourceField.name];
				for(var i = 0; i < field.length; i++) {
					if(field[i].value === $scope.pivot._id) {
						index[$scope.sourceField.name].splice(i,1);
					}
				}
				$scope.srcIndex[index._id] = false;
			} else {
				var key = $scope.pivot[$scope.sourceField.field.contentfield];
				var value = $scope.pivot._id;
				index[$scope.sourceField.name].push({key: key, value: value});
				$scope.srcIndex[index._id] = true;
			}
			index.$update();
		}
	};

	$scope.setSelectedSrcItems = function() {
		for(var i = 0; i < $scope.contentList.length; i++) {
			if($scope.contentList[i][$scope.sourceField.name] === undefined) {
				$scope.contentList[i][$scope.sourceField.name] = [];
			}
			var field = $scope.contentList[i][$scope.sourceField.name];
			for(var n = 0; n < field.length; n++) {
				if(field[n].value === $scope.pivot._id) {
					$scope.srcIndex[$scope.contentList[i]._id] = true;
				}
			}
		}
	};

	$scope.destIndex = {};
	$scope.selectDestination = function(index) {
		if($scope.pivotType === undefined) {
			$scope.pivotType = 'destination';
		}
		if($scope.pivotType === 'destination') {
			$scope.reset('destIndex', 'srcIndex', index);
			$scope.setSelectedSrcItems();
		} else {
			var isActive = $scope.destIndex[index._id];
			if(isActive) {
				var field = $scope.pivot[$scope.sourceField.name];
				for(var i = 0; i < field.length; i++) {
					if(field[i].value === index._id) {
						$scope.pivot[$scope.sourceField.name].splice(i, 1);
					}
				}
				$scope.destIndex[index._id] = false;
			} else {
				var key = index[$scope.sourceField.field.contentfield];
				var value = index._id;
				$scope.pivot[$scope.sourceField.name].push({value: value, key: key});
				$scope.destIndex[index._id] = true;
			}
			$scope.pivot.$update();
		}
	};

	$scope.$watch('source', function() {
		delete($scope.sourceField);
		if($scope.source !== undefined) {
			$scope.contentList = ContentFactory.query({contenttype: $scope.source.name});
			$scope.contentRefFields = $scope.getContentRefFields($scope.source.schemaOptions);
		}
	});
	$scope.$watch('sourceField', function() {
		if($scope.sourceField !== undefined) {
			$scope.referencedList = ContentFactory.query({contenttype: $scope.sourceField.field.contenttype});
		}
	});
})

.run(function(MenuService) {
  MenuService.add('content', {title: "References", weight: 50, link: "contentreferences"});
})
;