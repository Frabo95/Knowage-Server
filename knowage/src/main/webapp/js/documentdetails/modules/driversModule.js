(function() {
    angular.module('DriversModule',[])
    		.service('DriversService',['sbiModule_translate','resourceService','sbiModule_messaging',
    			function(sbiModule_translate,resourceService,sbiModule_messaging){
    			//  var injector = angular.injector();
    			 // var DocumentService = injector.get('DocumentService');
	    		  var driversResource = {};
	      		  var crudService = resourceService;
	      		  self.translate = sbiModule_translate;
	      		 // var requiredPath = DocumentService.requiredPath;
	      		  driversResource.changedDrivers = [];
	      		  driversResource.driverParuses = [];
	      		  driversResource.driversForDeleting = [];
	      		  driversResource.lovIdAndColumns = [];
	      		  driversResource.paruseColumns = {};
	      		  driversResource.driverRelatedObject;
	      		  driversResource.analyticalDrivers = [];

	      		  //*****Dependencies*****

	      		  driversResource.visualDependencies = "visualdependencies";
	      		  driversResource.dataDependenciesName = "datadependencies";
	      		  driversResource.selectedVisualCondition = {};
	      		  driversResource.selectedDataCondition = {};
	      		  driversResource.visusalDependencyObjects = [];
	      		  driversResource.dataDependencyObjects = [];
	      		  driversResource.changedVisualDependencies = [];
	      		  driversResource.changedDataDependencies = [];
	      		  driversResource.dataDependenciesForDeleting = [];
	      		  driversResource.visualDependenciesForDeleting = [];
	      		  driversResource.driverRelatedObject = {};
	    		  driversResource.driversOnObject = [];
	    		  driversResource.driversNum =0;
	      		driversResource.getParusesByAnaliticalDriverId = function (driverId){
	    			   var base = "2.0/analyticalDrivers";
	                   var path = driverId + "/modes";
	                   crudService.get(base,path).then(function(response){
	                		for(var i = 0; i < response.data.length; i++) {
	                			var existingDriverList = driversResource.driverParuses.filter(paruse => (paruse.useID == response.data[i].useID))
	                			if(existingDriverList.length != 0)
	                				continue;
	                			driversResource.driverParuses.push(response.data[i]);
	                		}
	                   });
	    		   }
	      		driversResource.getAllAnalyticalDrivers = function (){
	    			   var base = "2.0/analyticalDrivers";
	                   var path = "";
	                   crudService.get(base,path).then(function(response){
	                			driversResource.analyticalDrivers=response.data;
	                			 for(var i = 0;i< driversResource.analyticalDrivers.length;i++){
	             	      			driversResource.getParusesByAnaliticalDriverId(driversResource.analyticalDrivers[i].id);
	             	    		 }
	                   });
	    		   }

	      		driversResource.getDriverRelatedObject = function(basePath,endPath){
	      			crudService.get(basePath,endPath).then(function(response){
	      				driversResource.driverRelatedObject = response.data;
	      			});
	      		}

	      		driversResource.setDriverRelatedObject = function(driverRelatedObject){
	      				driversResource.driverRelatedObject = driverRelatedObject;
	      		}

	      		driversResource.getDriversOnRelatedObject = function(basePath,endPath){
	      			crudService.get(basePath,endPath).then(function(response){
	      				driversResource.driversOnObject = response.data;
	      				driversResource.driversNum =driversResource.driversOnObject.length > 1;
	      			});
	      		}

	      		driversResource.setDriversOnRelatedObject = function(driversOnRelatedObject){
	      			driversResource.driversOnObject = driversOnRelatedObject;
	      			driversResource.driversNum =driversResource.driversOnObject.length > 1;
	      		}


	      	  driversResource.persistDrivers = function(driverableObjectId,requiredPath){
	           	 var basePath = driversResource.visualDependencies;
	          	 var baseDataPath = driversResource.dataDependenciesName;
	           	 var querryParams = "";
	           	driverPostBasePath = driverableObjectId + "/drivers" ;
	           	for(var i = 0; i < driversResource.changedDrivers.length; i++){
	           		if(driversResource.changedDrivers[i].newDriver){
	           			 prepareDriverForPersisting(driversResource.changedDrivers[i]);
	           			crudService.post(requiredPath,driverPostBasePath,driversResource.changedDrivers[i]).then(function(response){
	           				if(response.data.errors){
	               				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	               			}else
	        				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.drivercreated"), 'Success!');

	           					var driverIndex = driversResource.driversOnObject.findIndex(i => i.priority ==response.data.priority);
	           					if(driverIndex == -1){
	           						driversResource.driversOnObject.push(response.data);
	           					}else{driversResource.driversOnObject[driverIndex].id = response.data.id}
		           					 driversResource.getAllAnalyticalDrivers();
		           					 driversResource.driversNum = (driversResource.driversOnObject.length > 1);
	    	        				 querryParams = setQuerryParameters(response.data.id);
	    	        				 basePath =driverableObjectId +"/" + basePath + querryParams;
	    	        	             baseDataPath = driverableObjectId +"/" + baseDataPath + querryParams;
	    	        				 getLovsByAnalyticalDriverId(response.data.parID);
	           			});
	           		}else{
	           			prepareDriverForPersisting(driversResource.changedDrivers[i]);
	           			var driverPutBasePath = driverableObjectId + "/drivers/" +  driversResource.changedDrivers[i].id;
	           			crudService.put(requiredPath,driverPutBasePath,driversResource.changedDrivers[i]).then(function(response){
	           				if(response.data.errors){
	               				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	               			}else
	        				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.driverupdated"), 'Success!');
	           			});
	           		}
	           	}
	           	driversResource.changedDrivers = [];
	            }

	      	 var prepareDriverForPersisting = function(driver){
	         	setParameterInfo(driver);
	         	delete driver.newDriver;
	 			delete driver.$$hashKey;
	 			delete driver.parameter.checks;
	 			delete driver.parameter.$$hashKey;
	 			delete driver.parameter.$$mdSelectId;
	 			driver.modifiable = 0;
	         };
	         var setParameterInfo = function(driver){
	          	 for(var i = 0 ; i<driversResource.analyticalDrivers.length; i++){
	          		 if(driversResource.analyticalDrivers[i].label==driver.parameter.name){
	          			 driver.parameter = driversResource.analyticalDrivers[i];
	          		 	 driver.parID = driversResource.analyticalDrivers[i].id;}
	          	 }
	           };
	      		driversResource.persistVisualDependency = function(driverableObjectId,requiredPath){
	      	       	for(var i = 0; i < driversResource.changedVisualDependencies.length; i++){
	      	       		var visualDependency = driversResource.changedVisualDependencies[i];
	      	       		var visualPath = driverableObjectId +  '/visualdependencies';
	      	       		if(visualDependency.newDependency){
	      	       			prepareDependencyForPersisting(visualDependency)
	      	       			crudService.post(requiredPath,visualPath,visualDependency).then(function(response){
	      	       				if(response.data.errors){
	      	              				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	      	              			}else
	      	       				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.visualdependecycreated"), 'Success!');
	      	       			});;
	      	       		}else{
	      	       			crudService.put(requiredPath,visualPath,visualDependency).then(function(response){
	      	       				if(response.data.errors){
	      	              				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	      	              			}else
	      	       				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.visualdependecyupdated"), 'Success!');
	      	       			});;
	      	       		}
	      	       	}
	      	      driversResource.changedVisualDependencies = [];
	      	       };

	      	     driversResource.persistDataDependency = function(driverableObjectId,requiredPath){
	      	       	for(var i = 0; i < driversResource.changedDataDependencies.length; i++){
	      	       		var persistances =  Object.keys(driversResource.paruseColumns);
	      	       		var filterColumns =  Object.values(driversResource.paruseColumns);
	      	       		var dataDependency = driversResource.changedDataDependencies[i];
	      	       		var isNew = dataDependency.newDependency;
	      	       		var prog = dataDependency.prog;
	      	       		var dataPath = driverableObjectId + '/datadependencies';
	      	       		var parusesForDataDependency={};
	      	       		var filterColumnsForDataDependency=[];
	      	       		parusesForDataDependency = dataDependency.persist;
	      	       		for(var j = 0 ; j < persistances.length;j++){
	      	       			if(persistances[j] != "undefined" && parusesForDataDependency[persistances[j]]){
	      	       			var newDataDependency = {};
	      	       			if(prog == dataDependency.prog){
	      	       				newDataDependency = dataDependency;
	      	       			}else{
	      	       				newDataDependency = angular.copy(dataDependency);
	      	       			}
	      	       			newDataDependency.filterColumn =  filterColumns[j]
	      	       			var paruse = driversResource.driverParuses.filter(par => par.useID==persistances[j])
	      	       			newDataDependency.paruseId= paruse[0].useID;
	      			        		if(isNew){
	      			        			prepareDependencyForPersisting(newDataDependency);
	      			        			delete newDataDependency.persist;
	      			        			crudService.post(requiredPath,dataPath,newDataDependency).then(function(response){
	      			        				if(response.data.errors){
	      			               				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	      			               			}else
	      			        				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.datadependecycreated"), 'Success!');
	      			        			});
	      			        			newDataDependency.prog++;
	      			        		}else{
	      			        			delete newDataDependency.persist;
	      			        			crudService.put(requiredPath,dataPath,newDataDependency).then(function(response){
	      			        				if(response.data.errors){
	      			               				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	      			               			}else
	      			        				sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.datadependecyupdated"), 'Success!');
	      			        			});
	      			        			newDataDependency.prog++;
	      	       			}
	      	       		}
	      	       	}
	      	       };

	      	     }
	      	     var prepareDependencyForPersisting = function(dependency){
	             	delete dependency.newDependency;
	             };


	             driversResource.deleteDriverVisualDependency = function(visualDependency,driverableObjectId,requiredPath){
	             	  var visualDependencyBasePath = driverableObjectId + "/" + driversResource.visualDependencies + "/delete";
	             	  crudService.post(requiredPath,visualDependencyBasePath,visualDependency).then(function(response){
	             		  if(response.data.errors){
	              				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	              			}else
	       	      		sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.deleted"), 'Success!');
	       	      	  });
	             };

	             driversResource.deleteDriverDataDependency = function(dataDependency,driverableObjectId,requiredPath){
	             	  var dataDependencyBasePath = driverableObjectId + "/" + driversResource.dataDependenciesName + "/delete";
	             	  crudService.post(requiredPath,dataDependencyBasePath,dataDependency).then(function(response){
	             		if(response.data.errors){
	          				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	          			}else
	             		sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.deleted"), 'Success!');
	             	  });
	           };

	           driversResource.deleteDrivers = function(driverableObjectId,requiredPath){
	           	for(var i = 0; i < driversResource.driversForDeleting.length; i++){
	           		driversResource.deleteDriverById(driversResource.driversForDeleting[i],driverableObjectId,requiredPath);
	           	}
	           	driversResource.driversForDeleting = [];
	           };

	           driversResource.deleteDriverById = function(driver,driverableObjectId,requiredPath){
	              var basePath = driverableObjectId + "/" + 'drivers' ;
	          	  var basePathWithId = basePath + "/" + driver.id;
	          	  crudService.delete(requiredPath,basePathWithId).then(function(response){
	          		if(response.data.errors){
	      				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Failure!!!');
	      			}else
	              		sbiModule_messaging.showInfoMessage(self.translate.load("sbi.documentdetails.toast.deleted"), 'Success!');
	              });
	        };

	             driversResource.deleteVisualDependencies = function(driverableObjectId,requiredPath){
	             	for(var i = 0; i < driversResource.visualDependenciesForDeleting.length; i++){
	             		driversResource.deleteDriverVisualDependency(driversResource.visualDependenciesForDeleting[i],driverableObjectId,requiredPath)
	             	}
	             	driversResource.visualDependenciesForDeleting=[];
	             };

	             driversResource.deleteDataDependencies = function(driverableObjectId,requiredPath){
	             	for(var i = 0; i < driversResource.dataDependenciesForDeleting.length; i++){
	             		driversResource.deleteDriverDataDependency(driversResource.dataDependenciesForDeleting[i],driverableObjectId,requiredPath)
	             	}
	             	driversResource.dataDependenciesForDeleting=[];
	             };


				driversResource.getAllAnalyticalDrivers();
	      	return driversResource;
    		}]);
})();