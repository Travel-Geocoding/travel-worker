const server = require('../server/server-instance');
const Job = require('../job-manager/job');
const JobLauncher = require('../job-manager/job-launcher');
const DomainError = require('../models/error');
const Route = require('../models/route');
const RouteRepository = require('../repositories/route-repository');

const maxNumberOfCalls = process.env.NUMBER_OF_CALLS_BY_API_KEY;

module.exports = function(job) {

  let totalPageCount = 0;
  let totalCallCount = 0;

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start launching bulk api job`);
      return job.data.apiKey;
    })
    .then((apiKey) => {

      return RouteRepository.listWithPaginationForProcessNeeding({ pageNumber: 1 })
        .then((firstRouteResult) => {

          totalPageCount = firstRouteResult.page.totalPageCount;

          const initialPromise = Promise.resolve();

          return firstRouteResult.routes
            .reduce((sequentialPromises, route) => {

              return sequentialPromises
                .then(() => launchJobForRoute({ route, apiKey, totalCallCount }))
                .then((newTotalCallCount) => {
                  totalCallCount = newTotalCallCount;
                });

            }, initialPromise);

        })
        .then(() => {

          const initialPromise = Promise.resolve();

          return Array.from({ length: totalPageCount - 1 }, (v, i) => i + 2)
            .reduce((sequentialPromises, pageNumber) => {

              return sequentialPromises
                .then(() => RouteRepository.listWithPaginationForProcessNeeding({ pageNumber }))
                .then((routePageResult) => {

                  const intermediatePromise = Promise.resolve();

                  return routePageResult.routes
                    .reduce((sequentialPromises, route) => {

                      return sequentialPromises
                        .then(() => launchJobForRoute({ route, apiKey, totalCallCount }))
                        .then((newTotalCallCount) => {
                          totalCallCount = newTotalCallCount;
                        });

                    }, intermediatePromise);

                });

            }, initialPromise);

        });
    })
    .catch((error) => {
      if (error instanceof DomainError.MaxNumberOfCallsExceeded) {
        return;
      } else {
        throw error;
      }
    })
    .then(() => {
      server.logger().info(`Completed launching bulk api job`);
    })
    .catch((error) => {
      server.logger().error(`Failed rlaunching bulk api job because: ${error}`);
      throw error;
    });
};

function launchJobForRoute({ route, apiKey, totalCallCount }) {

  route.state = Route.State.PROCESSING;

  if (totalCallCount >= maxNumberOfCalls) {
    throw new DomainError.MaxNumberOfCallsExceeded();
  }
  return RouteRepository.update(route)
    .then(() => {
      const job = Job.geocodeRouteDetail({ route: route, apiKey });
      JobLauncher.launch({ job });
      return totalCallCount + 1;
    });
}