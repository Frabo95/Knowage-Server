/**
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.
 *
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(){

	angular.module('qbe_viewer').service('qbeUrlBuilderService',["$httpParamSerializer",function($httpParamSerializer) {

	    var parameters = [];
	    var httpParamSerializer = $httpParamSerializer;
			var baseUrl = "";
			var getQueryString = function(){
				var queryString = "";
	      for(var i = 0;i < parameters.length;i++){
	      	var params = getQueryStringFromObj(parameters[i]);
	        queryString = queryString + "&" + params;
	      }
				return queryString;
			}

	    var getQueryStringFromObj = function(obj){
	    	return httpParamSerializer(obj)
	    }

			return {

				setBaseUrl:function(url){
					baseUrl = url;
				},

				addQueryParams:function(paramsObj){
					parameters.push(paramsObj)
				},

				build:function(){
					return baseUrl + getQueryString();
				}

			}
	}] );


})()