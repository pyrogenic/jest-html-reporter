const mockdata = require('./mockdata');
const ReportGenerator = require('../src/reportGenerator');

function listify(html) {
	return html.toString().replace(/></g, '>\n<').split('\n');
}

describe('reportGenerator', () => {
	describe('renderHtmlReport', () => {
		let mockedConfig;

		beforeEach(() => {
			mockedConfig = {
				getOutputFilepath: () => 'test-report.html',
				getStylesheetFilepath: () => '../style/defaultTheme.css',
				getPageTitle: () => 'Test Report',
				getLogo: () => 'testLogo.png',
				getDateFormat: () => 'yyyy-mm-dd HH:MM:ss',
				getSort: () => 'default',
				getStable: () => false,
				shouldIncludeFailureMessages: () => true,
				getExecutionTimeWarningThreshold: () => 5,
				getCustomScriptFilepath: () => 'test.js',
				shouldUseCssFile: () => false,
			};
		});

		it('should return a HTML report based on the given input data', (done) => {
			const reportGenerator = new ReportGenerator(mockedConfig);

			return reportGenerator.renderHtmlReport({ data: mockdata.jestResponse.multipleTestResults, stylesheet: '' })
				.then((xmlBuilderOutput) => {
					expect(xmlBuilderOutput).not.toBeNull();
					expect(xmlBuilderOutput.toString()).toMatch('<html>');
					expect(xmlBuilderOutput.toString()).toMatch('<div id="timestamp">');
					done();
				})
				.catch(done);
		});

		it('should generate identical output when called twice', (done) => {
			mockedConfig.getStable = () => true;
			const mockedData = (n) => {
				const result = Object.create(mockdata.jestResponse.multipleTestResults);
				result.startTime += 32768 * n;
				result.testResults[0].perfStats.start -= n * 100;
				return result;
			};
			const reportGenerators = [new ReportGenerator(mockedConfig), new ReportGenerator(mockedConfig)];
			const promises = reportGenerators.map((generator, i) => generator.renderHtmlReport({
				data: mockedData(i),
				stylesheet: '',
			}));
			Promise.all(promises)
				.then((xmlBuilderOutputs) => {
					const xmlBuilderOutput = xmlBuilderOutputs.pop().toString();
					expect(xmlBuilderOutput).toMatch('<html>');
					xmlBuilderOutputs.forEach((otherOutput) => {
						expect(listify(otherOutput)).toEqual(listify(xmlBuilderOutput));
					});
					done();
				})
				.catch(done);
		});

		it('should return reject the promise if no data was provided', () => {
			expect.assertions(1);
			const reportGenerator = new ReportGenerator(mockedConfig);

			return expect(reportGenerator.renderHtmlReport({ data: null, stylesheet: null })).rejects
				.toHaveProperty('message', 'Test data missing or malformed');
		});
	});
});
