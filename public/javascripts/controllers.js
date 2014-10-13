var hamboxControllers = angular.module('hamboxControllers', ['ui.bootstrap']);

//==================================================================================================
// Controller for the network status
//==================================================================================================

function NetStatusCtrl($scope, $rootScope, $interval, socket) {

    $scope.init = function() {
        $scope.refreshRateSubmit();        
    }
    
    $rootScope.watchedInterface = "wlan0"
    $rootScope.watchedMacAddress = "00:00:00:00:00:00";
    var refreshPromise = undefined;
        
    $scope.refreshRates = [
        {id: '0', name: '0.5s', value: 500},
        {id: '1', name: '1s', value: 1000},
        {id: '2', name: '2s', value: 2000},
        {id: '3', name: '3s', value: 3000},
        {id: '5', name: '5s', value: 5000}
    ];    
    
    $scope.selectedRate = $scope.refreshRates[2];
    
    $scope.refreshRateSubmit = function() {
        var refreshInterval = $scope.selectedRate.value;
        if (refreshPromise != undefined) {
            $interval.cancel(refreshPromise);
        }
        refreshPromise = $interval(getStationsDump, refreshInterval);
    }
    
    $scope.setRefreshRate = function(rate) {
        $scope.selectedRate = rate;
        $scope.refreshRateSubmit();
    }
    
    $scope.neighborsListConfig = {  
        options: {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Received power'
            },
            subtitle: {
                text: 'dBm'
            },
            xAxis: {
                categories: ['00:00:00:00:00:00<br>0.0.0.0'],
                title: {
                    text: null
                }                    
            },
            yAxis: {
                min: -100,
                max: -20,
                title: {
                    text: 'dBm',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' dBm'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    },
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                                $scope.setWatchedMacAddress(this.category);
                            }
                        }
                    }
                },
                series: {threshold: -100}
            },  
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -40,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                shadow: true
            },
            credits: {
                enabled: false
            }
        },                  
        series: [{
            name: 'Avg',
            data: [-60],
            dataLabels: {color: 'red'},
            color: '#FF6666'
        }, {
            name: 'Now',
            data: [-60],
            dataLabels: {color: 'grey'},
            color: 'grey'
        }]                                                           
    }
    
    $scope.setWatchedMacAddress = function(category) {
        console.log(category);
        $rootScope.watchedMacAddress = category.split("<")[0];
    }
    
    $scope.neighborWatchConfig = {
        options: {
            chart: {
                type: 'gauge',
                plotBorderWidth: 1,
                plotBackgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#FFF4C6'],
                        [0.3, '#FFFFFF'],
                        [1, '#FFF4C6']
                    ]
                },
                plotBackgroundImage: null,
                height: 300
            },            
            title: {
                text: '00:00:00:00:00:00<br>0.0.0.0'
            },
            pane: [{
                startAngle: -70,
                endAngle: 70,
                background: null,
                center: ['50%', '105%'],
                size: 360
            }],    
            yAxis: [{
                min: -100,
                max: -20,
                tickInterval: 10,
                minorTickInterval: 1,
                minorTickLength: 5,
                minorTickPosition: 'outside',
                tickPosition: 'outside',
                labels: {
                    rotation: 'auto',
                    distance: 20,
                    step: 1
                },
                plotBands: [{
                    from: -100,
                    to: -90,
                    color: '#FF8080',
                    innerRadius: '100%',
                    outerRadius: '97%'
                },
                {
                    from: -90,
                    to: -60,
                    color: '#FFC266',
                    innerRadius: '100%',
                    outerRadius: '97%'
                },
                {
                    from: -60,
                    to: -20,
                    color: '#80FF80',
                    innerRadius: '100%',
                    outerRadius: '97%'
                }   
                          ],
                pane: 0,
                title: {
                    text: 'dBm',
                    y: -40
                }
            }],
            plotOptions: {
                gauge: {
                    dataLabels: {
                        enabled: true,
                        format: "{y: .0f}",
                        y: -32
                    },
                    dial: {
                        radius: '100%',
                        rearLength: "-35%"
                    }
                }
            },
            credits : {
                enabled: false
            }
        },
        series: [{
            data: [-60],
            yAxis: 0,
            dataLabels: {x: -15}
        }, {
            data: [-60],
            yAxis: 0,
            dataLabels: {x: 15, color: 'red'},
            dial: {
                backgroundColor: 'red'
            }            
        }]             
    }
    
    socket.on('stationsdump:reply', function(jsondata) {
        if (refreshPromise != undefined) {
            var neighborschart = $('#neighlist').highcharts();
            var neighborgaugechart = $('#neighwatch').highcharts();
            var categories = [];
            var powernow = [];
            var poweravg = [];
            var stationdata = JSON.parse(jsondata);
            
            for (var macaddrkey in stationdata)
            {
                categories.push(macaddrkey + '<br>' + stationdata[macaddrkey][7]);
                powernow.push(stationdata[macaddrkey][3]);
                poweravg.push(stationdata[macaddrkey][4]);
                
                if ($rootScope.watchedMacAddress == macaddrkey) {
                    neighborgaugechart.setTitle({text: macaddrkey + '<br><span style="font-size:10px">' + stationdata[macaddrkey][7] + '</span>'});
                    neighborgaugechart.series[0].points[0].update(stationdata[macaddrkey][3]);
                    neighborgaugechart.series[1].points[0].update(stationdata[macaddrkey][4]);
                }
            }
            
            neighborschart.xAxis[0].setCategories(categories);
            neighborschart.series[0].setData(poweravg);
            neighborschart.series[1].setData(powernow);
        }
    });
    
    var getStationsDump = function () {
        socket.emit('stationsdump:query', 'wlan0');
        var currentdate = new Date();
        //console.log(neighborsRefreshInterval + ">" + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds());
    };  
    
    $scope.$on('$destroy', function(){
        if (refreshPromise != undefined) {
            $interval.cancel(refreshPromise);
            refreshPromise = undefined;
        }
    });
}

//==================================================================================================
// Controller for the network configs grid
//==================================================================================================

function NetConfigsCtrl($scope, WirelessConfig, InetState, CurrentConfig, socket) {

    $scope.init = function() {
        $scope.refreshIfaceState();
        $scope.refreshCurrentWireless();
    }

    socket.on('ifacestate', function(jsondata) {
        var data = JSON.parse(jsondata);
        var data_iw = data["iw"];
        var data_ip = data["ip"];
        $scope.wirelessifaces = [];
        $scope.wiredifaces = [];
        for (var iwkey in data_iw)
        {
            var ipdata = data_ip[iwkey];
            var iwdata = data_iw[iwkey];
            var macaddr = iwdata[1];
            var type = iwdata[2];
            var active = (ipdata[1] == "UP");
            var ipaddr = "";
            var ipmask = 0;
            var chan = 0;
            var freq = 0;
            var bw = 0;
            var txpower = 0;
            if (active)
            {
                ipaddr = ipdata[4];
                ipmask = ipdata[5];
                chan = iwdata[4];
                freq = iwdata[5];
                bw = iwdata[6];
                txpower = iwdata[7];
            }
            $scope.wirelessifaces.push({
                iface: iwkey,
                type: type,
                macaddr: macaddr,
                active: active,
                ipaddr: ipaddr,
                ipmask: ipmask,
                chan: chan,
                freq: freq,
                bw: bw,
                txpower: txpower
            });
        }
        
        for (var ipkey in data_ip)
        {
            if (data_ip[ipkey][2] == "ether")
            {
                if (!(ipkey in data_iw))
                {
                    var ipdata = data_ip[ipkey];
                    var active = (ipdata[1] == "UP");
                    var macaddr = ipdata[3];
                    var ipaddr = "";
                    var ipmask = 0;
                    if (active)
                    {
                        ipaddr = ipdata[4];
                        ipmask = ipdata[5];
                    }
                    $scope.wiredifaces.push({
                        iface: ipkey,
                        macaddr: macaddr,
                        active: active,
                        ipaddr: ipaddr,
                        ipmask: ipmask
                    });
                } 
                
            }
        }
    });
    
    socket.on('currentconfig:wireless', function(jsondata) {
        var data = JSON.parse(jsondata);
        $scope.wirelesscurrentconfig = [];
        for (var i in data)
        {
            var ifaceitem = data[i];
            if (ifaceitem["type"] == "ibss")
            {
                $scope.wirelesscurrentconfig.push(ifaceitem);
            }
        }
    });
    
    $scope.wirelessconfigs = WirelessConfig.query();
    
    $scope.wirelessIfaceStateGridOptions = { data: "wirelessifaces",
        enableCellSelection: false,
        enableRowSelection: false,
        enableCellEdit: false,
        enableColumnResize: true,
        showFilter: true,
        columnDefs: [
            { field:'active', displayName: 'Active', enableCellEdit: false, width: 60,
                cellTemplate: '<input type="checkbox" disabled ng-model="row.entity.active">'
            },
            {field:'iface', displayName:'Iface', enableCellEdit: false, width: 60},
            {field:'macaddr', displayName:'MAC', enableCellEdit: false, width: 140},
            {field:'ipaddr', displayName:'IP', enableCellEdit: false, width: 120},
            {field:'ipmask', displayName:'Mask', enableCellEdit: false, width: 60},
            {field:'freq', displayName:'F(MHz)', enableCellEdit: false, width: 80},
            {field:'bw', displayName:'BW(MHz)', enableCellEdit: false, width: 80},
            {field:'txpower', displayName:'P(mBm)', enableCellEdit: false, width: 80}
        ]
    };
        
    $scope.wiredIfaceStateGridOptions = { data: "wiredifaces",
        enableCellSelection: false,
        enableRowSelection: false,
        enableCellEdit: false,
        enableColumnResize: true,
        showFilter: true,
        columnDefs: [
            { field:'active', displayName: 'Active', enableCellEdit: false, width: 60,
                cellTemplate: '<input type="checkbox" disabled ng-model="row.entity.active">'
            },
            {field:'iface', displayName:'Iface', enableCellEdit: false, width: 60},
            {field:'macaddr', displayName:'MAC', enableCellEdit: false, width: 140},
            {field:'ipaddr', displayName:'IP', enableCellEdit: false, width: 120},
            {field:'ipmask', displayName:'Mask', enableCellEdit: false, width: 60}
        ]
    };
    
    $scope.wirelessCurrentConfigGridOptions = { data: "wirelesscurrentconfig",
        enableCellSelection: false,
        enableRowSelection: false,
        enableCellEdit: false,
        enableColumnResize: true,
        showFilter: true,
        columnDefs: [
            {field:'iface', displayName:'Iface', enableCellEdit: false, width: 60},
            {field:'ipaddr', displayName:'IP', enableCellEdit: false, width: 120},
            {field:'ipmask', displayName:'Mask', enableCellEdit: false, width: 60},
            {field:'essid', displayName:'ESSID', enableCellEdit: false, width: 160},
            {field:'bssid', displayName:'BSSID', enableCellEdit: false, width: 140},
            {field:'freq', displayName:'F(MHz)', enableCellEdit: false, width: 80},
            {field:'bw', displayName:'BW(MHz)', enableCellEdit: false, width: 80},
            {field:'mbm', displayName:'P(mBm)', enableCellEdit: false, width: 80},
            { field:'', displayName: 'Store', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="cfgStoreBtn" type="button"  ng-click="newWirelessConfigRowFromCurrent(\
                    row.entity)" ><span class="glyphicon glyphicon-download"></span></button>'
            },            
            { field:'', displayName: 'Run', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="cfgRunBtn" type="button"  ng-click="runCurrentWirelessConfig(\
                    row.entity)" ><span class="glyphicon glyphicon-play"></span></button>'
            },            
            { field:'', displayName: 'Delete', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="cfgDelBtn" type="button"  ng-click="delCurrentWirelessConfig(\
                    row.entity)" ><span class="glyphicon glyphicon-remove"></span></button>'
            }            
        ]
    };
    
    $scope.newWirelessConfigRowFromCurrent = function(data) {
        $scope.wirelessconfigs.push({
            _id: -1,
            name: 'new', 
            iface: data.iface,
            iploc: data.ipaddr,
            iplocmask: data.ipmask,
            ipnet: '',
            ipnetmask: 8,
            essid: data.essid,
            bssid: data.bssid,
            freq: data.freq,
            bw: data.bw,
            txpower: data.mbm
        });
    }

    $scope.runCurrentWirelessConfig = function(data) {
        alert("TODO");
    }
    
    $scope.delCurrentWirelessConfig = function(data) {
        alert("TODO");
    }
    
    $scope.wirelessConfigGridOptions = { data: "wirelessconfigs",
        enableCellSelection: true,
        enableRowSelection: false,
        enableCellEdit: true,
        enableColumnResize: true,
        showFilter: true,
        columnDefs: [
            {field:'name', displayName: 'Name', enableCellEdit: true, width: 140},
            {field:'iface', displayName:'Iface', enableCellEdit: true, width: 60},
            {field:'iploc', displayName:'IP', enableCellEdit: true, width: 120},
            {field:'iplocmask', displayName:'Mask', enableCellEdit: true, width: 60},
            //{field:'ipnet', displayName:'HamNet IP', enableCellEdit: true},
            //{field:'ipnetmask', displayName:'NetM', enableCellEdit: true},
            {field:'essid', displayName:'ESSID', enableCellEdit: true, width: 160},
            {field:'bssid', displayName:'BSSID', enableCellEdit: true, width: 140},
            {field:'freq', displayName:'F(MHz)', enableCellEdit: true, width: 80},
            {field:'bw', displayName:'BW(MHz)', enableCellEdit: true, width: 80},
            {field:'txpower', displayName:'P(mBm)', enableCellEdit: true, width: 80},
            { field:'', displayName: 'Save', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="wcEditBtn" type="button"  ng-click="saveWirelessConfigItem(\
                    row)" ><span class="glyphicon glyphicon-save"></span></button>'
            },
            { field:'', displayName: 'Use', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="wcRunBtn" type="button"  ng-click="useWirelessConfigItem(\
                    row)" ><span class="glyphicon glyphicon-upload"></span></button>'
            },
            { field:'', displayName: 'Delete', enableCellEdit: false, width: 60,
                cellTemplate: '<button id="wcDelBtn" type="button"  ng-click="delWirelessConfigItem(\
                    row)" ><span class="glyphicon glyphicon-remove"></span></button>'
            }
        ]
    };
    
    $scope.saveWirelessConfigItem = function(row) {
        if (row.entity._id == -1) {
            socket.emit('addwirelessconfig', row.entity);
        }
        else {
            socket.emit('updatewirelessconfig', row.entity);
        }
    }
    
    $scope.useWirelessConfigItem = function(row) {
        alert("TODO");
    }
    
    $scope.delWirelessConfigItem = function(row) {
        if (row.entity._id == -1) {
            var index = this.row.rowIndex;
            $scope.wirelessConfigGridOptions.selectItem(index, false);
            $scope.wirelessconfigs.splice(index, 1);
        }
        else {
            socket.emit('delwirelessconfig', row.entity);
            $scope.wirelessconfigs = WirelessConfig.query();
        }
    }
    
    $scope.refreshWirelessConfig = function() {
        $scope.wirelessconfigs = WirelessConfig.query();
    }
    
    $scope.refreshIfaceState = function() {
        InetState.query();
    }

    $scope.refreshCurrentWireless= function() {
        CurrentConfig.wireless();
    }
    
    $scope.refreshCurrentWired= function() {
        CurrentConfig.wired();
    }   
     
    $scope.addWirelessConfigRow = function() {
        $scope.wirelessconfigs.push({
            _id: -1,
            name: 'new', 
            iface: 'wlan0',
            iploc: '10.0.0.1',
            iplocmask: 24,
            ipnet: '',
            ipnetmask: 8,
            essid: 'BroadbandHamnet-v2',
            bssid: '82:CC:16:64:64:41',
            freq: 2392,
            bw: 5,
            txpower: 300
        });
    }
    

}

