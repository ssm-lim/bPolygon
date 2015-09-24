function bPolygon(map){
	var me = this;
	
	me.map = map;
	me.geoData = {};
	me.eventFn = {};
	me.selected = null;
	me.isToggled = false;
	me.nowPlace = null;
};
bPolygon.prototype.getGeoData = function(rCode){
	var me = this;
	if(!me.geoData[rCode]){
		$.getJSON('./geojson/' + rCode + '.json', function (geojson) {
			var data = geojson.features, geo = {};
			$.each(data, function(idx, region){
				var geometry = region.geometry, properties = region.properties;
				geo[properties.code] = {
						name : properties.name,
						code : properties.code,
						type : geometry.type,
						polygonObj : (geometry.type != 'MultiPolygon') ? me.makePolygon(geometry.coordinates) : me.makeMultiPolygon(geometry.coordinates)
				};
			});
			me.geoData[rCode] = geo;
		});
	}
	return function(){
		var deferred = $.Deferred();
		setTimeout(function() {
			deferred.resolve(me.geoData[rCode]);
		}, 500);
		return deferred.promise();
	}();
}
bPolygon.prototype.makePolygon = function(coordinates){
	var path = [];
	var clat1 = 180.0, clat2 = 0.0, clng1 = 180.0, clng2 = 0.0;
	$.each(coordinates[0], function(seq, coordinate){
		// path 생성
		path.push(new daum.maps.LatLng(coordinate[1], coordinate[0]));
		// Center lat, lng 계산
		clat1 = (coordinate[1] < clat1) ? coordinate[1] : clat1;
		clat2 = (coordinate[1] > clat2) ? coordinate[1] : clat2;
		clng1 = (coordinate[0] < clng1) ? coordinate[0] : clng1;
		clng2 = (coordinate[0] > clng2) ? coordinate[0] : clng2;
	});
	
	return {
		polygon : new daum.maps.Polygon({
	    	map : null,
	        path: path,
	        strokeWeight: 1,
	        strokeColor: '#004c80',
	        strokeOpacity: 1,
	        fillColor: '#fff',
	        fillOpacity: 0.7
	    }),
		clat : clat1 + ((clat2 - clat1) / 2),
		clng : clng1 + ((clng2 - clng1) / 2)
	};
};
bPolygon.prototype.makeMultiPolygon = function(coordinates){
	var me = this;
	var tmp = [], polygons = [], dlat = 0.0;
	var clat1 = 180.0, clat2 = 0.0, clng1 = 180.0, clng2 = 0.0;
	$.each(coordinates, function(seq, coordinate){
		var polygon = me.makePolygon(coordinate);
		tmp.push(polygon);
	}); 

	$.each(tmp, function(seq, polygon){
		clat1 = (polygon.clat < clat1) ? polygon.clat : clat1;
		clat2 = (polygon.clat > clat2) ? polygon.clat : clat2;
		clng1 = (polygon.clng < clng1) ? polygon.clng : clng1;
		clng2 = (polygon.clng > clng2) ? polygon.clng : clng2;
		polygons.push(polygon.polygon);
	}); 
	
	return {
		polygon : polygons,
		clat : clat1 + ((clat2 - clat1) / 2),
		clng : clng1 + ((clng2 - clng1) / 2)
	};
};

bPolygon.prototype.setDaumEvent = function(evStr, isSet, fn){
	var me = this;
	var data = me.geoData[me.nowPlace];
	for( var region in data ){
		$.each($(data[region].polygonObj.polygon), function(idx, polygon){
			var regData = data[region];
			if(fn){
				if(isSet){
					daum.maps.event.addListener(polygon, evStr, function(e) {
						var code = regData.code;
						var name = regData.name;
						fn(polygon, e, code, name);
					});
				} else {
					daum.maps.event.removeListener(polygon, evStr, fn);
				}
			}
		});
	}
};
bPolygon.prototype.setClsEvent = function(evStr, fn){
	var me = this;
	var data = me.geoData[me.nowPlace];
	if(fn){
		for( var region in data ){
			$(".polygon-grp-" + region).on(evStr, { polygons : data[region].polygonObj.polygon, region : region, pathFn : fn }, function(e){
				e.data.pathFn(me, e.data.polygons, e.data.region);
			});
		}
	}
};
bPolygon.prototype.showPolygon = function(data){
	var me = this;
	for( var region in data ){
		var regData = data[region];
		// polygon 생성
		$.each($(data[region].polygonObj.polygon), function(idx, polygon){
			polygon.setMap(me.map);
			$(polygon.Vc[0]).attr("class","polygon-grp-" + regData.code);
		});
		
		// 오버레이 생성
		regData.customOverlay = new daum.maps.CustomOverlay({
		    position: new daum.maps.LatLng(regData.polygonObj.clat, regData.polygonObj.clng),
		    content: "<div class='area'>" + regData.name + "</div>"   
		});
		regData.customOverlay.setMap(me.map);
		regData.customOverlay.setZIndex(10);
	}
};
bPolygon.prototype.hidePolygon = function(data){
	for( var region in data ){
		$.each($(data[region].polygonObj.polygon), function(idx, polygon){
			polygon.setMap(null);
		});
	}
};
bPolygon.prototype.init = function(code){
	var me = this;
	me.getGeoData(code).done(function(data){
		// 데이터 가져오기 및 polygon 생성
		if(code != me.nowPlace){
			if(me.nowPlace) me.hidePolygon(me.geoData[me.nowPlace]);
			me.showPolygon(data);
			me.nowPlace = code;
		}
			
		
		// polygon 이벤트 적용
		for( var event in me.event ){
			if(me.event[event].pathFn){
				me.setClsEvent(event, me.event[event].pathFn);
			}
			if(me.event[event].mapFn){
				me.setDaumEvent(event, me.event[event].mapFn);
			}
		}
		
		me.setDaumEvent('click', true, function(polygon){
			polygon.setOptions({fillColor: '#09f'});
		});
	});
};