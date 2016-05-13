var dataObject = {};

function fileselect(evt) {
  var file = evt.target.files[0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      dataObject = results;
      main();
    }
  });
}

$(document).ready(function () {
  $("#csv-file").change(fileselect);
});

function duration_parse(crt, dur, days) {
  var sum_dur = [];
  for (var i = 0; i < crt.length;) {
    var count = dur[i];
    
    var flag = 1;
    for (var j = i + 1; j < crt.length; j++) {
      if (days[i] == days[j]) {
        count = count + dur[j];
        flag++;
      }
    }
    sum_dur.push(count);
    if (flag > 1) {
      i = i + flag;
    } else {
      i++;
    }
  }
  return {sum_dur: sum_dur}
}



function date_status_parse(crt, statistics_sum, days) {
  var arr_pass = [];
  var arr_error = [];
  var arr_fail = [];
  var arr_stop = [];
  for (var i = 0; i < crt.length;) {
    var count_pass = 0;
    var count_error = 0;
    var count_fail = 0;
    var count_stopped = 0;
    var pr = 1;
    if (statistics_sum[i] == 'passed') {
      count_pass++;
    } else if (statistics_sum[i] == 'error') {
      count_error++;
    } else if (statistics_sum[i] == 'failed') {
      count_fail++;
    } else if (statistics_sum[i] == 'stopped') {
      count_stopped++;
    }
    arr_pass.push(count_pass);
    arr_error.push(count_error);
    arr_fail.push(count_fail);
    arr_stop.push(count_stopped);
    for (var j = i + 1; j < crt.length; j++) {
      if (days[i] == days[j]) {
        if (statistics_sum[j] == 'passed') {
          arr_pass[arr_pass.length - 1]++;
          pr++;
        } else if (statistics_sum[j] == 'error') {
          arr_error[arr_error.length - 1]++;
          pr++;
        } else if (statistics_sum[j] == 'failed') {
          arr_fail[arr_fail.length - 1]++;
          pr++;
        } else if (statistics_sum[j] == 'stopped') {
          arr_stop[arr_stop.length - 1]++;
          pr++;
        }
      }
    }
    i += pr;
  }
  return {arr_pass: arr_pass, arr_error: arr_error, arr_fail: arr_fail, arr_stop: arr_stop};
}

function main() {
  var Charts_sessions = new Marionette.Application();
  Charts_sessions.SessionCollection = Backbone.Collection.extend({});
  Charts_sessions.DurationsItemView = Marionette.ItemView.extend({
    initialize: function (options) {
      this.data = options.data;
      this.days_data = options.days_data;

    },
    render: function () {
      $('#main-region').highcharts({
        title: {
          text: ' Chart (duration vs. time)',
          x: -25
        },
        xAxis: {
          title: {
            text: 'created_at'
          },
          categories: this.days_data
        },
        yAxis: {
	  
          tickInterval: 500,
          title: {
            text: 'duration'
          },
          plotLines: [{
            value: 0,
            width: 1,
            color: '#8c8c8c'
          }]
        },
        legend: {
          align: 'right',
          x: -20,
          verticalAlign: 'top',
          y: 15,
          floating: true,
          backgroundColor: 'yellow',
          borderColor: '#b7b7b7',
          borderWidth: 1,
          shadow: false
		  
        },
        series: [{
          name: 'duration',
          color: 'blue',
          data: this.data
        }]
      });
    }
  });
  Charts_sessions.StatusesItemView = Marionette.ItemView.extend({
    initialize: function (options) {
      this.stopped = options.stopped
	  this.error = options.error;
      this.days_data = options.days_data;
      this.passed = options.passed;
      this.failed = options.failed;
 
    },
    render: function () {
      $('#container').highcharts({
        chart: {
          type: 'column'
        },
        title: {
          text:  " Stacked-chart (summary status vs. created at)  "
        },
        xAxis: {
			title: {
            text: 'created_at'
          },
          categories: this.days_data
        },
        yAxis: {
			
			
          min: 0,
          title: {
            text: 'summary status '
          }
        },
        legend: {
          align: 'right',
          x: -20,
          verticalAlign: 'top',
          y: 15,
          floating: true,
          backgroundColor: 'yellow',
          borderColor: '#b7b7b7',
          borderWidth: 1,
          shadow: false
        },
        tooltip: {
          headerFormat: '<b>{point.x}</b><br/>',
          pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
		
		
		
		
        plotOptions: {
          column: {
            stacking: 'normal',
            dataLabels: {
              enabled: true,
              formatter: function () {
                if (this.y != 0) {
                  return this.y;
                }
              },
              color: 'white',
              style: {
                textShadow: '0 0 4px black'
              }
            }
          }
        },
        series: [{
          name: 'passed_tests_count',
          color: 'green',
          data: this.passed
        }, {
          name: 'failed_tests_count',
          color: 'red',
          data: this.failed
        }, {
          name: 'error_tests_count',
          color: 'blink',
          data: this.error
        }, {
          name: 'stopped_tests_count',
          color: 'gray',
          data: this.stopped
        }]
		
      });
    }
  });

  var sessionCollection = new Charts_sessions.SessionCollection(dataObject.data);
  var dur = sessionCollection.pluck("duration");
  var crt = sessionCollection.pluck("created_at");
  var statistics_sum = sessionCollection.pluck("summary_status");
  var arrays_object = [dur, crt, statistics_sum];
  _.map(arrays_object, function (num) {
    return num.pop();
  });
  var days = _.map(crt, function (num) {
    return num.split(/\s/)[0];
  });
  var uniq_days = _.uniq(days);
  var d_p = duration_parse(crt, dur, days);
  var d_s = date_status_parse(crt, statistics_sum, days);
  var sum_dur = d_p.sum_dur;
  var arr_pass = d_s.arr_pass;
  var arr_error = d_s.arr_error;
  var arr_fail = d_s.arr_fail;
  var arr_stop = d_s.arr_stop;
  var date_duration = [];
  for (var i = 0; i < uniq_days.length; i++) {
    date_duration.push([uniq_days[i], sum_dur[i]]);
  }
  var duration_view = new Charts_sessions.DurationsItemView({data: date_duration, days_data: uniq_days});
  var status_view = new Charts_sessions.StatusesItemView({
    days_data: uniq_days,
    passed: arr_pass,
    error: arr_error,
    failed: arr_fail,
    stopped: arr_stop
  });
  duration_view.render();
  status_view.render();
}
