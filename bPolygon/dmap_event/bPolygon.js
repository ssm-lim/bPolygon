function bPolygon(map){
	var me = this;
	
	// map 정보
	me.map = map;
	
	// 로드된 json정보를 객체화하여 저장
	me.geoData = {};
	
	// 로드된 지역 목록, 이벤트 중복 적용 방지
	me.loadList = [];
	
	// 선택된 지역정보
	me.info = {};
	
	// 이전에 선택된 지역
	me.selected = null;
	// 선택 여부
	me.isToggled = false;
	
	// 현재 보여지는 polygon의 지역
	me.nowPlace = null;
	
	// 이벤트
	me.event = {};
}
//json 데이터 호출
bPolygon.prototype.getInfo = function(){
	var me = this;
	return me.info;
};
// json 데이터 호출
bPolygon.prototype.getData = function(rCode){
	var me = this; 
	// rCode를 받아 해당 지역의 객체정보가 없다면 json 호출
	if(!me.geoData[rCode]){
		$.getJSON('./geojson/' + rCode + '.json', function (geojson) {
			var data = geojson.features, geo = {};
			$.each(data, function(idx, region){
				// ex) 11.json이라면 서울광역시(11)의 데이터이므로 pname, name을 설정
				var pname = geojson.name, pcode = geojson.code;
				var geometry = region.geometry, properties = region.properties;
				geo[properties.code] = {
						pname : pname,
						pcode : pcode,
						name : properties.name,
						code : properties.code,
						type : geometry.type,
						// polygon형태에 따라 결정
						polygonObj : (geometry.type != 'MultiPolygon') ? me.makePolygon(geometry.coordinates)
								// 현재로서는 전라남도의 광주광역시가 hole로 존재하므로 그것만 예외처리...
								: me.makeMultiPolygon(geometry.coordinates, (properties.code == '46') ? geo['29'] : null)
				};
			});
			me.geoData[rCode] = geo;
		});
	}
	// 
	// 비동기로 인해 결과가 undefined로 뜨는 것을 막기 위해 setTimeout, $.Deferred 사용
	return function(){
		var deferred = $.Deferred();
		// 사용환경에 따라 시간 조정... 
		// 조언 필요...ㅠㅠ
		setTimeout(function() {
			deferred.resolve(me.geoData[rCode]);
		}, 500);
		return deferred.promise();
	}();
};

// polygon 객체 생성
bPolygon.prototype.makePolygon = function(coordinates, hole){
	var path = [];
	var clat1 = 180.0, clat2 = 0.0, clng1 = 180.0, clng2 = 0.0, dlat = 0.0;
	$.each(coordinates[0], function(seq, coordinate){
		// 객체 생성에 필요한 path array 생성
		path.push(new daum.maps.LatLng(coordinate[1], coordinate[0]));
		// 오버레이 표시할 polygon center lat, lng 계산
		clat1 = (coordinate[1] < clat1) ? coordinate[1] : clat1;
		clat2 = (coordinate[1] > clat2) ? coordinate[1] : clat2;
		clng1 = (coordinate[0] < clng1) ? coordinate[0] : clng1;
		clng2 = (coordinate[0] > clng2) ? coordinate[0] : clng2;
	});
	
	// 전라남도의 경우 가장 큰 Polygon에 hole이 존재함.
	// clat의 최대치와 최소치를 빼서 차이가 가장 큰 Polygon이 크기도 가장 큰 Polygon으로 볼 수 있음 
	// ref : http://apis.map.daum.net/web/sample/donut/
	if(hole){
		dlat = clat2 - clat1;
		path = (hole.mkHole) ? [path, hole.path] : path;
	}
	return {
		polygon : new daum.maps.Polygon({
	    	map : null,
	        path: path,
	        strokeWeight: 1,
	        strokeColor: '#004c80',
	        strokeOpacity: 0.8,
	        fillColor: '#fff',
	        fillOpacity: 0.7
	    }),
	    dlat : dlat,
		clat : clat1 + ((clat2 - clat1) / 2),
		clng : clng1 + ((clng2 - clng1) / 2)
	};
};

// multipolygon의 경우 polygon객체 생성후 한 배열에 넣어줌
bPolygon.prototype.makeMultiPolygon = function(coordinates, hole){
	var me = this;
	var tmp = [], polygons = [], dlat = 0.0, dPolygon, dCoordinate;
	var clat1 = 180.0, clat2 = 0.0, clng1 = 180.0, clng2 = 0.0;
	$.each(coordinates, function(seq, coordinate){
		var polygon = me.makePolygon(coordinate, hole);
		
		// 전라남도의 경우.. dlat이 가장 큰 polygon을 찾음
		if(hole){
			if(polygon.dlat > dlat){
				dCoordinate = coordinate;
				dPolygon = polygon;
				dlat = polygon.dlat;
			}
		}
		// 임시배열에 저장
		tmp.push(polygon);
	}); 

	// multipolygon 최대 lat, lng / 최소 lat, lng 계산
	$.each(tmp, function(seq, polygon){
		clat1 = (polygon.clat < clat1) ? polygon.clat : clat1;
		clat2 = (polygon.clat > clat2) ? polygon.clat : clat2;
		clng1 = (polygon.clng < clng1) ? polygon.clng : clng1;
		clng2 = (polygon.clng > clng2) ? polygon.clng : clng2;
		polygons.push(polygon.polygon);
	}); 
	
	// 전라남도의 경우, 가장 큰 polygon을 찾은 후 광주광역시 path를 hole로 지정하여 새 객체 생성 후 저장
	if(dlat > 0) {
		var index = polygons.indexOf(dPolygon.polygon);
		polygons[index] = me.makePolygon(dCoordinate, { path : hole.polygonObj.polygon.getPath(), mkHole : true }).polygon;
	}
	
	// center값 계산 후 polygon 배열을 반환
	return {
		polygon : polygons,
		clat : clat1 + ((clat2 - clat1) / 2),
		clng : clng1 + ((clng2 - clng1) / 2)
	};
};
// 지도 상에 polygon을 보이게 함
bPolygon.prototype.showPolygon = function(data){
	var me = this;
	
	// ex) 넘어온 데이터가 서울특별시(11.json)이면 region의 값은 종로구, 강남구, .... 
	for( var region in data ){
		var regData = data[region];
		// polygon 생성, jQuery의 each 함수를 사용하면 
		// data[region].polygonObj.polygon의 타입에(객체의 배열, 단일객체) 관계 없이 사용가능
		$.each($(data[region].polygonObj.polygon), function(idx, polygon){
			// 선택 이력이 있는 상태에서 다시 보일 경우, 이력을 초기화하고 색상도 원래대로 복구
			polygon.setOptions({fillColor: '#fff'});
			polygon.setMap(me.map);
		});
		
		// overlay 생성, 각 polygonObj가 가지고 있는 lat, lng에 따라 배치
		regData.customOverlay = new daum.maps.CustomOverlay({
		    position: new daum.maps.LatLng(regData.polygonObj.clat, regData.polygonObj.clng),
		    content: "<div class='area'>" + regData.name + "</div>"   
		});
		regData.customOverlay.setMap(me.map);
	}
};
// 현재 지도 상에 있는 polygon, overlay를 사라지게 함
bPolygon.prototype.hideAllPolygon = function(){
	var me = this;
	var data = me.geoData[me.nowPlace];
	for( var region in data ){
		$.each($(data[region].polygonObj.polygon), function(idx, polygon){
			polygon.setMap(null);
		});
		data[region].customOverlay.setMap(null);
		data[region].customOverlay = null;
	}
};
bPolygon.prototype.show = function(code){
	var me = this;
	
	// 선택 이력 초기화
	me.selected = null;
	me.isToggled = false;
	
	// 정보 초기화
	if(code == 0) {
		me.info = {
				pcode : "0",
				pname : "전국",
				code : "0",
				name : "전국"
		};
	}
	
	me.getData(code).done(function(data){
		// 데이터 가져오기 및 polygon 생성
		if(code != me.nowPlace){
			if(me.nowPlace) me.hideAllPolygon();
			me.showPolygon(data);
			
			// 현재 지역 저장
			me.nowPlace = code;
			
			// Center 이동, data 첫번째 요소의 중앙점
			me.map.setCenter(new daum.maps.LatLng(data[Object.keys(data)[0]].polygonObj.clat, data[Object.keys(data)[0]].polygonObj.clng));
			
			// 전국 or 이하 지역 여부에 따라 zoom level 변경
			if(code != 0){
				me.map.setLevel(9);
			} else {
				me.map.setLevel(13);
			}
			
			// load 이력이 없는 경우에만 이벤트 지정
			if(me.loadList.indexOf(code) == -1) {
				// polygon 이벤트 적용
				var data = me.geoData[me.nowPlace];
				for( var event in me.event ){
					if(me.event[event]){
						for( var region in data ){
							me.event[event](me, data[region]);
						}
					}
				}
				me.loadList.push(code);
			}
		}
	});
};
bPolygon.prototype.init = function(){
	var me = this;
	
	// 이벤트 저장 후
	me.event = {
		click : function(me, data){
			var polygons = data.polygonObj.polygon;
			$.each($(polygons), function(idx, polygon){
				// 모바일에서는 click보단 mousedown이 반응이 빠름
				daum.maps.event.addListener(polygon, 'mousedown', function(e) {
					var pcode = data.pcode;
					var pname = data.pname;
					var code = data.code;
					var name = data.name;
					// 선택시 정보 저장
					me.info = {
							pname : pname,
							pcode : pcode,
							code : code,
							name : name,
					};

					// 전국레벨에서는 선택시 색상 변경과 동시에 선택한 지역의 polygon이 보이게 됨
					if(me.nowPlace == 0){
						$.each($(me.geoData[me.nowPlace][code].polygonObj.polygon), function(idx, grpPoly){
							grpPoly.setOptions({fillColor: '#B70037'});
						});
						me.show(code);
						
					} else {
						// 이전의 선택한 지역과 현재 선택한 지역이 같고
						if(me.selected == code){
							// 선택이 되어져 있으면 색상 복구 후 선택 관련 요소 초기화
							if(me.isToggled){
								$.each($(me.geoData[me.nowPlace][code].polygonObj.polygon), function(idx, grpPoly){
									grpPoly.setOptions({fillColor: '#fff'});
								});
								me.selected = null;
								me.isToggled = !me.isToggled;
							} 
						} else {
							// 이전의 선택한 지역과 현재 선택한 지역이 다르고 
							// 일단 색상 변경 후 
							$.each($(me.geoData[me.nowPlace][code].polygonObj.polygon), function(idx, grpPoly){
								grpPoly.setOptions({fillColor: '#B70037'});
							});
							
							// 선택 이력이 있는 경우
							if(me.isToggled){
								// 이전 선택 지역의 색상을 원상태로 복구
								$.each($(me.geoData[me.nowPlace][me.selected].polygonObj.polygon), function(idx, grpPoly){
									grpPoly.setOptions({fillColor: '#fff'});
								});
							} else {
								// 선택 이력이 없는 경우 선택 여부를 바꿈
								// 이 경우는 false -> true
								me.isToggled = !me.isToggled;
							}
							// 현재 선택 지역 저장
							me.selected = code;
						}
					}
				});
			});
		}
	};
	
	// polygon을 띄움
	me.show('0');
};