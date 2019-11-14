module Workarea
  module Admin
    module Reports
      class TimelineViewModel < ApplicationViewModel
        include GroupByTime

        class Event
          def self.build(*data)
          end

          attr_reader :name, :date

          def initialize(name, date)
            @name = name
            @date = date
          end
        end

        def summary
          {
            revenue: summarize(graph_data_for('revenue')),
            orders: summarize(graph_data_for('orders')),
            units_sold: summarize(graph_data_for('units_sold')),
            customers: summarize(graph_data_for('customers')),
            releases: summarize(graph_data_for('releases')),
            custom_events: summarize(graph_data_for('custom_events'))
          }
        end

        def graph_data
          {
            labels: grouped_data.keys.reverse,
            datasets: {
              revenue: transform(graph_data_for('revenue')),
              orders: transform(graph_data_for('orders')),
              units_sold: transform(graph_data_for('units_sold')),
              customers: transform(graph_data_for('customers')),
              releases: transform(graph_data_for('releases')),
              custom_events: transform(graph_data_for('custom_events'))
            }
          }
        end

        def events
          []
        end

        private

        def releases
          @releases ||= Release.published_between(
            starts_at: starts_at,
            ends_at: ends_at
          ).to_a
        end

        def custom_events
          @custom_events ||= Workarea::Reports::CustomEvent.occurred_between(
            starts_at: starts_at.to_date,
            ends_at: ends_at.to_date
          ).to_a
        end

        def date_range
          starts_at.to_date..ends_at.to_date
        end

        def grouped_data
          date_range.each_with_object({}) do |date, group|
            group[date] = results.select { |r| r.starts_at.to_date == date }
          end
        end

        def graph_data_for(type)
#          require 'pry'; binding.pry if type == 'custom_events'
          return release_graph_data if type == 'releases'
          return custom_event_graph_data if type == 'custom_events'

          grouped_data.transform_values do |values|
            (values || []).map { |v| v[type] }
          end
        end

        def release_graph_data
          date_range.each_with_object({}) do |date, group|
            data = releases.select { |r| r.published_at.to_date == date }
            group[date] = [data.count]
          end
        end

        def custom_event_graph_data
          date_range.each_with_object({}) do |date, group|
            data = custom_events.select { |r| r.occurred_at == date }
            group[date] = [data.count]
          end
        end

        def transform(data)
          data.map { |k, v| Hash[x: k.to_time, y: v.first] }.reverse
        end

        def summarize(data)
          data
            .select { |_, v| ! v.empty? }
            .reduce(0) { |sum, (_k, v)| sum + v.first }
        end
      end
    end
  end
end
