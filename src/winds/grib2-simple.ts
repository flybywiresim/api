// grib2-simple
//
// Copyright 2018 The grib2-simple Developers. See the LICENSE file at
// https://github.com/UdSAES/grib2-simple/LICENSE
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// grib2-simple may be freely used and distributed under the MIT license

const moment = require('moment-timezone');

export namespace Grib2sample {

  const parseSection0 = (buffer, startIndex) => {
      const result = {
          discipline: buffer[startIndex + 6],
          edition: buffer[startIndex + 7],
          totalLength: buffer.readUInt32BE(startIndex + 12),
      };

      const result2 = {
          startIndex,
          lengthOfRawData: 16,
          data: result,
      };

      return result2;
  };

  const parseSection1 = (buffer, startIndex) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          originationCenterId: buffer.readUInt16BE(startIndex + 5),
          originationSubCenterId: buffer.readUInt16BE(startIndex + 7),
          masterTableVersion: buffer[startIndex + 9],
          localTableVersionNumber: buffer[startIndex + 10],
          significanceOfReferenceTime: buffer[startIndex + 11],
          year: buffer.readUInt16BE(startIndex + 12),
          month: buffer[startIndex + 14],
          day: buffer[startIndex + 15],
          hour: buffer[startIndex + 16],
          minute: buffer[startIndex + 17],
          second: buffer[startIndex + 18],
          productionStatus: buffer[startIndex + 19],
          typeOfProcessedData: buffer[startIndex + 20],
          referenceTimestamp: moment.tz({
              y: buffer.readUInt16BE(startIndex + 12),
              M: buffer[startIndex + 14] - 1,
              d: buffer[startIndex + 15],
              h: buffer[startIndex + 16],
              m: buffer[startIndex + 17],
              s: buffer[startIndex + 18],
          }, 'UTC').valueOf(),
      };

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseSection3 = (buffer, startIndex) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          sourceOfGridDefinition: buffer[startIndex + 5],
          numberOfDataPoints: buffer.readUInt32BE(startIndex + 6),
          numberOfOctetsForOptionalDefinitions: buffer[10],
          interpretationOfOptionalDefinitions: buffer[11],
          gridDefinitionTemplateNumber: buffer[13],
          gridDefinitionTemplate: parseGridDefinition3(buffer.slice(startIndex)),
      };

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseGridDefinition3 = (sectionBuffer) => {
      const grid3 = {
          numberOfPointsAlongParallel: sectionBuffer.readUInt32BE(30),
          numberOfPointsAlongMeridian: sectionBuffer.readUInt32BE(34),
          La1: sectionBuffer.readInt32BE(46) / 1e6,
          Lo1: sectionBuffer.readInt32BE(50) / 1e6,
          La2: sectionBuffer.readInt32BE(55) / 1e6,
          Lo2: sectionBuffer.readInt32BE(59) / 1e6,
          iInc: sectionBuffer.readInt32BE(63) / 1e6,
          jInc: sectionBuffer.readInt32BE(67) / 1e6,
          scanningMode: sectionBuffer[71],
      };

      return grid3;
  };

  const parseSection4 = (buffer, startIndex, referenceTimestamp) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          numberOfCoordinateValuesAfterTemplate: buffer.readUInt16BE(startIndex + 5),
          productDefinitionTemplateNumber: buffer.readUInt16BE(startIndex + 7),
          productDefinitionTemplate: null,
      };

      result.productDefinitionTemplate = parseProductDefinition4(buffer.slice(startIndex), referenceTimestamp);

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseProductDefinition4 = (sectionBuffer, referenceTimestamp) => {
      let factor = 1000;
      const result = {
          parameterCategory: sectionBuffer[9], // 2 for wind stuff and 0 for temp
          parameterNumber: sectionBuffer[10], // 2 UGRD, 3 for VGRD
          typeOfGenerationProcess: sectionBuffer[11],
          backgroundGenerationProcessIdentifier: sectionBuffer[12],
          analysisGenerationProcessIdentifier: sectionBuffer[13],
          hoursCutOff: sectionBuffer.readInt16BE(14),
          minutesCutOff: sectionBuffer[16],
          timeUnitRange: sectionBuffer[17],
          forecastTime: sectionBuffer.readUInt32BE(18),
          forecastTimestap: referenceTimestamp + factor * sectionBuffer.readUInt32BE(18),
          firstfixedSurfaceType: sectionBuffer[22],
          firstfixedScaleFactor: sectionBuffer.readUInt16BE(23),
          firstfixedValue: sectionBuffer.readInt32BE(24),
      };

      const { timeUnitRange } = result;

      if (timeUnitRange === 0) {
          factor *= 60;
      } else if (timeUnitRange === 1) {
          factor *= 60 * 60;
      } else if (timeUnitRange === 2) {
          factor *= 24 * 60 * 60;
      } else if (timeUnitRange === 10) {
          factor *= 3 * 60 * 60;
      } else if (timeUnitRange === 11) {
          factor *= 6 * 60 * 60;
      } else if (timeUnitRange === 12) {
          factor *= 12 * 60 * 60;
      } else if (timeUnitRange === 13) {
          factor *= 1;
      } else {
          // error
      }
      return result;
  };

  const parseSection5 = (buffer, startIndex) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          numberOfDataPoints: buffer.readUInt32BE(startIndex + 5),
          dataRepresentationTemplateNumber: buffer.readUInt16BE(startIndex + 9),
          dataRepresentationTemplate: parseDataRepresentationTemplate5(buffer.slice(startIndex)),
      };

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseDataRepresentationTemplate5 = (sectionBuffer) => {
      const R = sectionBuffer.readFloatBE(11);
      // eslint-disable-next-line no-bitwise
      let E = sectionBuffer.readUInt16BE(15) & 0x7fff;
      // eslint-disable-next-line no-bitwise
      let D = sectionBuffer.readUInt16BE(17) & 0x7fff;

      // eslint-disable-next-line no-bitwise
      if ((sectionBuffer.readUInt16BE(15) >> 15) > 0) {
          E *= -1;
      }

      // eslint-disable-next-line no-bitwise
      if ((sectionBuffer.readUInt16BE(17) >> 15) > 0) {
          D *= -1;
      }

      return {
          R,
          E,
          D,
          numberOfBitsForPacking: sectionBuffer[19],
          typeOfOriginalFieldValues: sectionBuffer[20],
      };
  };

  const parseSection6 = (buffer, startIndex) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          bitMapIndicator: buffer[startIndex + 5],
          bitMap: buffer.slice(startIndex + 6, startIndex + buffer.readUInt32BE(startIndex)),
      };

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseSection7 = (buffer, startIndex) => {
      const result = {
          length: buffer.readUInt32BE(startIndex),
          numberOfSection: buffer[startIndex + 4],
          rawData: buffer.slice(startIndex + 5, startIndex + buffer.readUInt32BE(startIndex)),
          // rawData: buffer.slice(startIndex + 5),
      };

      return {
          startIndex,
          lengthOfRawData: result.length,
          data: result,
      };
  };

  const parseAllSections = (gribBuffer, startIndex) => {
      const section0 = parseSection0(gribBuffer, startIndex);
      const section1 = parseSection1(gribBuffer, section0.startIndex + section0.lengthOfRawData);
      const section3 = parseSection3(gribBuffer, section1.startIndex + section1.lengthOfRawData);
      const section4 = parseSection4(gribBuffer, section3.startIndex + section3.lengthOfRawData, section1.data.referenceTimestamp);
      const section5 = parseSection5(gribBuffer, section4.startIndex + section4.lengthOfRawData);
      const section6 = parseSection6(gribBuffer, section5.startIndex + section5.lengthOfRawData);
      const section7 = parseSection7(gribBuffer, section6.startIndex + section6.lengthOfRawData);

      return {
          referenceTimestamp: section1.data.referenceTimestamp,
          forecastTimestamp: section4.data.productDefinitionTemplate.forecastTimestamp,
          startIndex,
          lengthOfRawData: section0.data.totalLength,
          sections: {
              section0,
              section1,
              section3,
              section4,
              section5,
              section6,
              section7,
          },
      };
  };

  export const parseCompleteGrib2Buffer = (grib2Buffer) => {
      const completeResult = [];
      let startIndex = 0;

      while (startIndex < grib2Buffer.length) {
          const result = parseAllSections(grib2Buffer, startIndex);
          startIndex += result.lengthOfRawData;

          completeResult.push(result);
      }

      return completeResult;
  };

}
