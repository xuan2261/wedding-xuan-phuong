module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 2,
      url: [
        "http://localhost/",
        "http://localhost/events/groom/"
      ],
      settings: {
        chromeFlags: "--headless=new --no-sandbox",
        maxWaitForLoad: 45000,
        disableStorageReset: true
      }
    },
    assert: {
      assertions: {
        "categories:performance": [
          "warn",
          { "minScore": 0.8, "aggregationMethod": "median" }
        ],
        "categories:accessibility": [
          "error",
          { "minScore": 0.95, "aggregationMethod": "median" }
        ],
        "categories:best-practices": [
          "error",
          { "minScore": 0.9, "aggregationMethod": "median" }
        ],
        "largest-contentful-paint": [
          "warn",
          { "maxNumericValue": 3000, "aggregationMethod": "median" }
        ],
        "cumulative-layout-shift": [
          "error",
          { "maxNumericValue": 0.1, "aggregationMethod": "median" }
        ],
        "total-byte-weight": [
          "warn",
          { "maxNumericValue": 8388608, "aggregationMethod": "median" }
        ],
        "is-crawlable": "off",
        "robots-txt": "off",
        "uses-long-cache-ttl": "off"
      }
    }
  }
};
