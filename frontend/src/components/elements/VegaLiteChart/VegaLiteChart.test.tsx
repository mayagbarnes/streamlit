/**
 * @license
 * Copyright 2018-2022 Streamlit Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react"
import { mount } from "src/lib/test_util"
import { Map as ImmutableMap, fromJS } from "immutable"
import { VegaLiteChart as VegaLiteChartProto } from "src/autogen/proto"
import { darkTheme, lightTheme } from "src/theme"

import mock from "./mock"
import { PropsWithHeight, VegaLiteChart, dataIsAnAppendOfPrev } from "./VegaLiteChart"

const getProps = (
  elementProps: Partial<VegaLiteChartProto> = {},
  props: Partial<PropsWithHeight> = {}
): PropsWithHeight => ({
  element: fromJS({
    ...mock,
    ...elementProps,
  }),
  width: 0,
  height: 0,
  theme: lightTheme.emotion,
  ...props,
})

const baseCase = ImmutableMap<any, any>(
{"data": {
  "values": [
    {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
  ]
}})

// Not an append if # of columns don't match
const testCase1 = ImmutableMap<any, any>(
  {"data": {
    "values": [
      {"a": "A", "b": 28, "c": 0}, {"a": "B", "b": 55, "c": 0}, {"a": "C", "b": 43, "c": 0},
    ]
  }})

// Not an append if prev # rows = current # rows
const testCase2 = ImmutableMap<any, any>(
  {"data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43},
    ]
  }})

// Not an append if prev # rows > current # rows
const testCase3 = ImmutableMap<any, any>(
  {"data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55},
    ]
  }})

// Not an append if prev # rows == 0
const testCase4 = ImmutableMap<any, any>(
{"data": {
  "values": []
}})

// TODO: Test light check of prev vs. new's last col, first and last row 
// const testCase5

// TODO: Test an append
// const testCase6

describe("VegaLiteChart Element", () => {
  it("renders without crashing", () => {
    const props = getProps()
    const wrapper = mount(<VegaLiteChart {...props} />)

    expect(wrapper.find("StyledVegaLiteChartContainer").length).toBe(1)
  })

  it("tests for appended data properly", () => {
    const cases = [ [baseCase, testCase1], [baseCase, testCase2], [baseCase, testCase3], [testCase4, baseCase]]
    const expectedVals = [false, false, false, false]

    cases.forEach( (test, idx) => {
      const expected = expectedVals[idx]
      const prevData = test[0]
      const data = test[1]
      const prevValuesObj = prevData.get("data")["values"]
      const valuesObj = data.get("data")["values"]
      const prevNumRows = prevValuesObj ? prevValuesObj.length : 0
      const numRows = valuesObj.length
      const prevNumCols = prevValuesObj[0] ? Object.keys(prevValuesObj[0]).length : 2
      const numCols = Object.keys(valuesObj[0]).length

      expect(dataIsAnAppendOfPrev(prevData, prevNumRows, prevNumCols, data, numRows, numCols)).toEqual(expected)
    })

  })

  it("pulls default config values from theme", () => {
    const props = getProps(undefined, { theme: darkTheme.emotion })

    const wrapper = mount<VegaLiteChart>(<VegaLiteChart {...props} />)
    const generatedSpec = wrapper.instance().generateSpec()

    expect(generatedSpec.config.background).toBe(
      darkTheme.emotion.colors.bgColor
    )
    expect(generatedSpec.config.axis.labelColor).toBe(
      darkTheme.emotion.colors.bodyText
    )
  })

  it("has user specified config take priority", () => {
    const props = getProps(undefined, { theme: darkTheme.emotion })

    const spec = JSON.parse(props.element.get("spec"))
    spec.config = { background: "purple", axis: { labelColor: "blue" } }

    props.element = fromJS({
      ...props.element.toObject(),
      spec: JSON.stringify(spec),
    })

    const wrapper = mount<VegaLiteChart>(<VegaLiteChart {...props} />)
    const generatedSpec = wrapper.instance().generateSpec()

    expect(generatedSpec.config.background).toBe("purple")
    expect(generatedSpec.config.axis.labelColor).toBe("blue")
    // Verify that things not overwritten by the user still fall back to the
    // theme default.
    expect(generatedSpec.config.axis.titleColor).toBe(
      darkTheme.emotion.colors.bodyText
    )
  })
})
