/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

namespace("sozi.editor.view", function (exports) {
    "use strict";

    var h = require("virtual-dom/h");
    var createElement = require("virtual-dom/create-element");
    var diff = require("virtual-dom/diff");
    var patch = require("virtual-dom/patch");

    exports.Properties = {

        init: function (container, selection, controller) {
            this.controller = controller;
            this.selection = selection;

            this.vtree = h("form");
            this.rootNode = createElement(this.vtree, {document: document});
            container.appendChild(this.rootNode);

            controller.addListener("repaint", this.repaint.bind(this));

            return this;
        },

        repaint: function () {
            var vtree = this.render();
            this.rootNode = patch(this.rootNode, diff(this.vtree, vtree));
            this.vtree = vtree;
        },

        render: function () {
            var c = this.controller;
            return h("form", [
                h("h1", "Frame"),

                h("table", [
                    this.renderTextField("Title", "title", this.getFrameProperty, c.setFrameProperty, true),
                    this.renderTextField("Id", "frameId", this.getFrameProperty, c.setFrameProperty, false),
                    this.renderCheckboxField("Show in frame list", "showInFrameList", this.getFrameProperty, c.setFrameProperty),
                    this.renderNumberField("Timeout (sec)", "timeoutMs", this.getFrameProperty, c.setFrameProperty, false, 0.1, 1000),
                    this.renderCheckboxField("Timeout enable", "timeoutEnable", this.getFrameProperty, c.setFrameProperty),
                    this.renderCheckboxField("Link to previous frame", "link", this.getLayerProperty, c.setLayerProperty),
                    this.renderCheckboxField("Clip", "clipped", this.getCameraProperty, c.setCameraProperty),
                    this.renderTextField("Reference element Id", "referenceElementId", this.getLayerProperty, c.setLayerProperty, true),
                    h("tr", [
                        h("th"),
                        h("td", h("input", {
                            type: "button",
                            value: "Fit to element",
                            onclick: c.fitElement.bind(c)
                        }))
                    ]),
                    this.renderCheckboxField("Autoselect element", "referenceElementAuto", this.getLayerProperty, c.setLayerProperty),
                    this.renderCheckboxField("Hide element", "referenceElementHide", this.getLayerProperty, c.setLayerProperty)
                ]),

                h("h1", "Transition"),

                h("table", [
                    this.renderNumberField("Duration (sec)", "transitionDurationMs", this.getFrameProperty, c.setFrameProperty, false, 0.1, 1000),
                    this.renderSelectField("Timing function", "transitionTimingFunction", this.getLayerProperty, c.setLayerProperty, {
                        "linear": "Linear",
                        "ease": "Ease",
                        "easeIn": "Ease in",
                        "easeOut": "Ease out",
                        "easeInOut": "Ease in-out",
                        "stepStart": "Step start",
                        "stepEnd": "Step end",
                        "stepMiddle": "Step middle"
                    }),
                    this.renderNumberField("Relative zoom (%)", "transitionRelativeZoom", this.getLayerProperty, c.setLayerProperty, true, 1, 0.01),
                    this.renderTextField("Path Id", "transitionPathId", this.getLayerProperty, c.setLayerProperty, true),
                    this.renderCheckboxField("Hide path", "transitionPathHide", this.getLayerProperty, c.setLayerProperty)
                ])
            ]);
        },

        renderTextField: function (label, property, getter, setter, acceptsEmpty) {
            var c = this.controller;

            var values = getter.call(this, property);
            var className = values.length > 1 ? "multiple" : undefined;
            var value = values.length != 1 ? "" : values[0];

            return h("tr", [
                h("th", label),
                h("td", h("input", {
                    type: "text",
                    value: value,
                    className: className,
                    onchange: function () {
                        var value = this.value;
                        if (acceptsEmpty || value.length) {
                            setter.call(c, property, value);
                        }
                    }
                }))
            ]);
        },

        renderCheckboxField: function (label, property, getter, setter) {
            var c = this.controller;

            var values = getter.call(this, property);
            var className = values.length > 1 ? "multiple" : undefined;
            var value = values.length != 1 ? undefined : values[0];

            return h("tr", [
                h("th", label),
                h("td", h("input", {
                    type: "checkbox",
                    className: className,
                    checked: value ? "checked" : undefined,
                    onchange: function () {
                        setter.call(c, property, this.checked);
                    }
                }))
            ]);
        },

        renderNumberField: function (label, property, getter, setter, signed, step, factor) {
            var c = this.controller;

            var values = getter.call(this, property);
            var className = values.length > 1 ? "multiple" : undefined;
            var value = values.length != 1 ? 0 : values[0] / factor;

            return h("tr", [
                h("th", label),
                h("td", h("input", {
                    type: "number",
                    value: value,
                    className: className,
                    min: signed ? undefined : 0,
                    step: step,
                    pattern: "[+-]?\\d+(\\.\\d+)?",
                    onchange: function () {
                        var value = parseFloat(this.value);
                        if (!isNaN(value) && (signed || value >= 0)) {
                            setter.call(c, property, value * factor);
                        }
                    }
                }))
            ]);
        },

        renderSelectField: function (label, property, getter, setter, options) {
            var c = this.controller;

            var values = getter.call(this, property);
            var className = values.length > 1 ? "multiple" : undefined;
            var value = values.length != 1 ? options[0] : values[0];

            return h("tr", [
                h("th", label),
                h("td",
                    h("select", {
                        className: className,
                        onchange: function () {
                            setter.call(c, property, this.value);
                        }
                    }, Object.keys(options).map(function (optionValue) {
                        return h("option", {
                            value: optionValue,
                            selected: value === optionValue
                        }, options[optionValue]);
                    }, this))
                )
            ]);
        },

        getFrameProperty: function (property) {
            var values = [];

            this.selection.selectedFrames.forEach(function (frame) {
                var current = frame[property];
                if (values.indexOf(current) < 0) {
                    values.push(current);
                }
            }, this);

            return values;
        },

        getLayerProperty: function (property) {
            var values = [];

            this.selection.selectedFrames.forEach(function (frame) {
                this.selection.selectedLayers.forEach(function (layer) {
                    var current = frame.layerProperties[layer.index][property];
                    if (values.indexOf(current) < 0) {
                        values.push(current);
                    }
                }, this);
            }, this);

            return values;
        },

        getCameraProperty: function (property) {
            var values = [];

            this.selection.selectedFrames.forEach(function (frame) {
                this.selection.selectedLayers.forEach(function (layer) {
                    var current = frame.cameraStates[layer.index][property];
                    if (values.indexOf(current) < 0) {
                        values.push(current);
                    }
                }, this);
            }, this);

            return values;
        }
    };
});
