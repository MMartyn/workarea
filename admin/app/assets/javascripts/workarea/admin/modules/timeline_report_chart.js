/**
 * @namespace WORKAREA.timelineReportChart
 */
WORKAREA.registerModule('timelineReportChart', (function () {
    'use strict';

    var updateChart = function (chart, event) {
            var $item = $(event.target).closest('.chart-legend__list-item'),
                dataset = chart.data.datasets[event.target.value];

            if (event.target.checked) {
                dataset.hidden = false;
                $item.removeClass('chart-legend__list-item--disabled');
            } else {
                dataset.hidden = true;
                $item.addClass('chart-legend__list-item--disabled');
            }

            chart.update();
        },

        hideTooltip = function (chart, event) {
            var $target = $(event.currentTarget),
                date = new Date($target.data('timelineReportChartEvent'));
        },

        showTooltip = function (chart, event) {
            var $target = $(event.currentTarget),
                date = new Date($target.data('timelineReportChartEvent')),
                activeElements = chart.tooltip._active || [];

            debugger
        },

        setupSidebar = function (chart) {
            $(chart.canvas)
                .closest('.view')
                    .find('[data-timeline-report-chart-event]')
                    .on('mouseenter', _.partial(showTooltip, chart))
                    .on('mouseleave', _.partial(hideTooltip, chart));
        },

        setupLegend = function (chart) {
            var legend = JST['workarea/admin/templates/chart_legend']({
                datasets: chart.data.datasets,
                enabled: WORKAREA.config.timelineReportChart.initiallyActive
            });

            $('#timeline-report-chart-legend')
            .html(legend)
            .on('change', '[type=checkbox]', _.partial(updateChart, chart))
                .find('[type=checkbox]')
                .trigger('change');
        },

        transformDataset = function (dataset, type) {
            return _.map(dataset, function (item) {
                var data = { x: new Date(item.x) };

                if (type === 'releases' || type === 'custom_events') {
                    data.y = item.y > 0 ? 0 : null;
                } else {
                    data.y = item.y || 0;
                }

                return data;
            });
        },

        buildDatasets = function (datasets) {
            return _.map(datasets, function (dataset, type) {
                var config = WORKAREA.config.timelineReportChart.datasets,
                    color = WORKAREA.config.timelineReportChart.colors[type],
                    dataConfig = _.merge({}, config, {
                        label: I18n.t('workarea.admin.reports.timeline.' + type),
                        borderColor: color,
                        backgroundColor: color,
                    });

                if (type === 'revenue') {
                    dataConfig.yAxisID = 'money-axis';
                } else {
                    dataConfig.yAxisID = 'unit-axis';
                }

                if (type === 'releases') {
                    dataConfig.pointStyle = 'triangle';
                    dataConfig.radius = 10;
                    dataConfig.hoverRadius = 13;
                    dataConfig.showLine = false;
                }

                if (type === 'custom_events') {
                    dataConfig.pointStyle = 'star';
                    dataConfig.radius = 10;
                    dataConfig.hoverRadius = 13;
                    dataConfig.showLine = false;
                }

                dataConfig.data = transformDataset(dataset, type);

                return dataConfig;
            });
        },

        getConfig = function (data) {
            return {
                type: 'line',
                data: {
                    labels: _.map(data.labels, function (value) {
                        return new Date(value);
                    }),
                    datasets: buildDatasets(data.datasets)
                },
                options: WORKAREA.config.timelineReportChart.options
            };
        },

        setup = function (index, canvas) {
            var data = $(canvas).data('timelineReportChart'),
                chart = new Chart(canvas.getContext('2d'), getConfig(data));

            setupLegend(chart);
            setupSidebar(chart);
        },

        init = function ($scope) {
            $('[data-timeline-report-chart]', $scope).each(setup);
        };

    return {
        init: init
    };
}()));
