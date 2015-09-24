$(function () {

    $.getJSON('./json/0.json', function (geojson) {

        var data = Highcharts.geojson(geojson, 'map');
        
        $.each(data, function () {
        	this.drilldown = this.properties['code'];
        	console.log(this.middleX);
        	this.middleX = (this.properties['middleX']) ? parseFloat(this.properties['middleX']) : 0.5;
        	this.middleY = (this.properties['middleY']) ? parseFloat(this.properties['middleY']) : 0.5;
        });
        
        $('#container').highcharts('Map', {
        	credits: { enabled: false },
            tooltip: { enabled: false },
            chart : {
                events: {
                    drilldown: function (e) {
                        if (!e.seriesOptions) {
                            var chart = this,
                                mapKey = e.point.drilldown;
                            chart.showLoading('<i class="icon-spinner icon-spin icon-3x"></i>'); // Font Awesome spinner

                            // Load the drilldown map
                            $.getJSON('./json/' + mapKey + '.json', function (geojson2) {

                                data = Highcharts.geojson(geojson2, 'map');

                                // Hide loading and add series
                                chart.addSeriesAsDrilldown(e.point, {
                                    name: e.point.name,
                                    data: data,
                                    showInLegend: false,
                                    dataLabels: {
                                        enabled: true,
                                        allowOverlap: true,
                                        format: '{point.name}'
                                    }
                                });
                            })
                            .done(function() {
                            	chart.hideLoading();
                            })
                            .fail(function() {
                        	    var fail = setTimeout(function () {
	                                    chart.showLoading('<i class="icon-frown"></i>' + e.point.name + ' 로드에 실패하였습니다.');
	                                    fail = setTimeout(function () {
	                                        chart.hideLoading();
                                    }, 1000);
                                }, 10);
                            });
                        }
                    }
                }
            },
            
            series : [{
                data : data,
                name: '전국',
                showInLegend: false,
                dataLabels: {
                    enabled: true,
                    allowOverlap: true,
                    format: '{point.properties.name}'
                }
            }],
            title: {
                text: '' 
            },
            subtitle: {
                text: ''
            },
            drilldown: {
                activeDataLabelStyle: {
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    textShadow: '0 0 3px #000000'
                },
                drillUpButton: {
                    relativeTo: 'spacingBox',
                    position: {
                        x: 0,
                        y: 60
                    }
                }
            }
        });
    });
});