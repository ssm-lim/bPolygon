/*
 *  - Highmaps
 * 	Example : http://www.highcharts.com/maps/demo/map-drilldown
 *  Document : http://api.highcharts.com/highmaps
 * */
function highMaps() {
    
	var me = this;

	me.chart = null;
	me.selected = '0';
	me.event = {
		select : function(){
			
		},
		unselect : function(){
			
		},
		drillup : function(){
			
		}
	};
	
	me.init();
};
highMaps.prototype.init = function(){
	var me = this;
	// 전국단위 지도 로드
	$.getJSON('./json/0.json', function (geojson) {
        var data = Highcharts.geojson(geojson, 'map');
        $.each(data, function () {
        	this.drilldown = this.properties['code'];
        });
        $('#map').highcharts('Map', {
        	credits: { enabled: false },
            chart : {
                events: {
                	// drilldown : 클릭시 하위레벨로 진입
                    drilldown: function (e) {
                        if (!e.seriesOptions) {
                        	// 상위레벨에서 선택한 부분의 코드값에 따라 하위레벨이 결정
                            var chart = this, mapKey = e.point.drilldown;
                            $.getJSON('./json/' + mapKey + '.json', function (geojson2) {
                                data = Highcharts.geojson(geojson2, 'map');
                                chart.addSeriesAsDrilldown(e.point, {
                                    name: e.point.name,
                                    data: data,
                                    showInLegend: false,
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: true,
                                        allowOverlap: false,
                                        format: '{point.name}',
                                        // 하위 지도 레이블 스타일 설정
                                        /* defaults : {
                                         * 		"color": "contrast", 
                                         * 		"fontSize": "11px", 
                                         * 		"fontWeight": "bold"; 
                                         * 		"textShadow": "0 0 6px contrast, 0 0 3px contrast" 
                                         * 	}
                                         *  디폴트 상태입니다. ex)textShadow: '0 0 0px #000000'를 설정하지 않는다면 textShadow 효과가 지속됩니다.
                                         *                                      * 
                                         * */
                                        style : {
                                        	color : '#000',
                                            textShadow: '0 0 0px #000000',
                                            fontWeight: "none",
                                            textDecoration: 'none'
                                        }
                                    },
                                    states: {
                                    	// 하위 지도 hover 스타일 설정
                                        hover: {
                                            color: '#99004C'
                                        },
                                        // 하위 지도 select 스타일 설정
                                        select: {
                                            color: '#998A00'
                                        }
                                    },
                                    tooltip: {
                                    	headerFormat: '',
                                        pointFormat: '{point.name}'
                                    }
                                });
                            });
                        }
                    },
                    drillup: function (e) {
                    	me.selected = '0';
                    	me.event.drillup();
                    }
                }
            },
            series : [{
                data : data,
                showInLegend: false,
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    allowOverlap: false,
                    shadow: false,
                    format: '{point.properties.name}'
                },
                states: {
                	// 상위 지도 hover 스타일 설정
                    hover: {
                        color: '#99004C',
                        borderColor: 'white'
                    }
                },
                tooltip: {
                	headerFormat: '',
                    pointFormat: '{point.properties.name}'
                }
            }],
            // 제목 제거
            title: null,
            // 부제목 제거
            subtitle: null,
            // 줌 설정
            mapNavigation: {
                enableMouseWheelZoom: true,
                enableTouchZoom : true
            },
            // 지역 선택시 하위 지도 띄우는 기능 설정
            drilldown: {
            	// 상위 지도 레이블 스타일 설정
                activeDataLabelStyle: {
                	color : '#000',
                	shadow: false,
                    textShadow: '0 0 0px #000000',
                    fontWeight: "none",
                    textDecoration: 'none'
                },
                // 상위 지도 버튼 스타일 설정
                drillUpButton: {
                    relativeTo: 'spacingBox'
                }
            },
            plotOptions: {
                series: {
                    point : {
                    	events: {
                            select: function () {
                            	// this.properties에 지정한 코드나 이름 값이 저장
                            	me.selected = this.properties.code;
                            	try {
                            		me.event.select();
                            	} catch(err){} 
                            },
                            unselect: function () {
                            	// 기본적으로는 select 이벤트 발생 후 unselect가 발생
                            	// 아래의 코드를 사용하면 unselect 적용 후 select 이벤트가 발생
                            	var p = this.series.chart.getSelectedPoints();
                                if(p.length > 0 && p[0].x == this.x) {
                                	try {
                                		me.event.unselect();
                                	} catch(err){} 
                                }
                                me.selected = this.properties.code.substring(0,2);
                            }
                        }
                    }
                }
            }
        });
        me.chart = $("#map").highcharts();
    });
};
highMaps.prototype.drillUp = function(){
	var me = this;
	if( me.chart.drilldownLevels != undefined && me.chart.drilldownLevels.length > 0){
		me.chart.drillUp();
	}
};
highMaps.prototype.drillDown = function(code){
	var me = this;
	if(me.selected.substring(0,2) != code.substring(0,2)){
		// drilldown 상태라면 drillup 후에 drilldown 발생
		if( me.chart.drilldownLevels != undefined && me.chart.drilldownLevels.length > 0){
			me.chart.drillUp();
		}
		// data 중에 파라미터로 넘어온 code 값과 동일한 것이 있다면 그 data를 drilldown
		$.each(me.chart.series[0].data, function(idx, obj){
			if(obj.properties.code == code){
				obj.firePointEvent('click');
			}
		});
	}
};
highMaps.prototype.select = function(code){
	var me = this;
	me.unselect();
	$.each(me.chart.series[0].data, function(idx, obj){
		if(obj.properties.code == code){
			obj.select(true);
		}
	});
};
highMaps.prototype.unselect = function(code){
	var me = this;
	$.each(me.chart.series[0].data, function(idx, obj){
		obj.select(false);
	});
};
