define([
    "dojo/_base/declare",
    "dojo/parser",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dstore/Memory",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/on",
    "dojo/date",
    "app/view/ValidationTextarea",
    "dojox/widget/TitleGroup",
    "dijit/TitlePane",
    "dojo/text!app/widgets/templates/case_escalations.html",
    "dojo/domReady!"
], function (declare, parser, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Memory, lang, dom, domStyle, on, date, ValidationTextarea, TitleGroup, TitlePane, template) { // jshint ignore:line

    var widget = null;

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, baseController], { // jshint ignore:line
        templateString: template,
        widgetsInTemplate: true,
        info: null,
        constructor: function (args) {
            lang.mixin(this, args);
            var widget = this;
            widget.ctrl = widget.lingoController;
            widget.data = widget.info;

            widget.caseAge = 0;
        },
        buildRendering: function () {
            this.inherited(arguments);
        },
        resize: function () {
            this.inherited(arguments);
        },
        init: function () {

        },
        getCaseAge: function (caseAge) {
            var widget = this;
            var reqObj = {
                "caseId": widget.data.caseId
            };
            var callback = function (obj) {
                if (obj.response.code == 200 && obj.data) {
                    widget.caseAge = obj.data.caseAgeInHrs;
                    widget.showDialogDivs();
                }
            };
            widget.ctrl.getAPI("getCaseAge", reqObj, callback);
        },
        getTimeFromLastEscalation: function (escDate) {
            var widget = this;
            var curDate = widget.formatDateForEscalation(new Date(), "YYYY-MM-DD H24:MI:SS");
            var diffInMs = date.difference(new Date(escDate), new Date(curDate), "millisecond");
            var diffInHrs = diffInMs / (1000 * 60 * 60);
            // console.log("diffInHrs:", diffInHrs);
            return diffInHrs;
        },
        getNextLevel: function (level) {
            if (level == "Level 0")
                return "Level 1";
            if (level == "Level 1")
                return "Level 2";
            if (level == "Level 2")
                return "Level 3";
            if (level == "Level 3")
                return "Level 4";
            if (level == "Level 4")
                return "Level 5";
        },
        showExceptionInfo: function (condition) {
            var widget = this;
            var l = widget.data.escalationLevel;
            var msg = "";
            if (condition == "one") {
                if (l == "Level 0") msg = "atleast 12 hours";
                else if (l == "Level 1") msg = "at least 24 hours and 2 hours since the last escalation";
                else if (l == "Level 2") msg = "at least 36 hours and 2 hours since the last escalation";
                else if (l == "Level 3") msg = "at least 48 hours and 2 hours since the last escalation";
                else if (l == "Level 4") msg = "at least 60 hours and 2 hours since the last escalation";
            } else if (condition == "two") {
                if (l == "Level 0") msg = "atleast 24 hours";
                else if (l == "Level 1") msg = "at least 36 hours and 2 hours since the last escalation";
                else if (l == "Level 2") msg = "at least 48 hours and 2 hours since the last escalation";
                else if (l == "Level 3") msg = "at least 72 hours and 2 hours since the last escalation";
                else if (l == "Level 4") msg = "at least 84 hours and 2 hours since the last escalation";
            } else if (condition == "three") {
                if (l == "Level 0") msg = "atleast 6 hours";
                else if (l == "Level 1") msg = "at least 12 hours and 2 hours since the last escalation";
                else if (l == "Level 2") msg = "at least 36 hours and 2 hours since the last escalation";
                else if (l == "Level 3") msg = "at least 48 hours and 2 hours since the last escalation";
                else if (l == "Level 4") msg = "at least 60 hours and 2 hours since the last escalation";
            }
            widget.line1Span.innerHTML = "This Case does not meet the criteria to be escalated at this time.";
            widget.line2Span.innerHTML = "Case must be opened for " + msg + " to request the next escalation level.";
            widget.lastEscalation.set("value", widget.data.escalationDate);
            widget.caseAgeInHrs.set("value", widget.caseAge + " Hours");

        },
        showDialogDivs: function () {
            var widget = this;
            var timeFromLastEsc = widget.getTimeFromLastEscalation(widget.data.escalationDate);
            var condition = "";
            if (widget.data.queueName == "BB Monitoring" || widget.data.queueName == "Data" || widget.data.queueName == "NMC" || widget.data.queueName == "SR ARC" || widget.data.queueName == "Data Lingo") {
                condition = "one";
                if ((widget.caseAge >= 12 && widget.data.escalationLevel == "Level 0") ||
                    (widget.caseAge >= 24 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 1") ||
                    (widget.caseAge >= 36 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 2") ||
                    (widget.caseAge >= 48 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 3") ||
                    (widget.caseAge >= 60 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 4")) {

                    domStyle.set(dom.byId(widget.escReasonDiv), "display", "block");
                    widget.submitBtn.set("disabled", false);
                } else {
                    domStyle.set(dom.byId(widget.exceptionDiv), "display", "block");
                    widget.showExceptionInfo(condition);
                }
                return;
            }
            else if (widget.data.queueName == "Voice" || widget.data.queueName == "ITAC Residential Escalation" || widget.data.queueName == "Voice Lingo" || widget.data.queueName == "Resi Lingo") {
                condition = "two";
                if ((widget.caseAge >= 24 && widget.data.escalationLevel == "Level 0") ||
                    (widget.caseAge >= 36 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 1") ||
                    (widget.caseAge >= 48 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 2") ||
                    (widget.caseAge >= 72 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 3") ||
                    (widget.caseAge >= 84 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 4")) {

                    domStyle.set(dom.byId(widget.escReasonDiv), "display", "block");
                    widget.submitBtn.set("disabled", false);
                } else {
                    domStyle.set(dom.byId(widget.exceptionDiv), "display", "block");
                    widget.showExceptionInfo(condition);
                }
                return;
            }
            else if (widget.data.queueName == "VoIP" || widget.data.queueName == "Managed Services" || widget.data.queueName == "ITAC Commercial" || widget.data.queueName == "ITAC Toll Free") {
                condition = "three";
                if ((widget.caseAge >= 6 && widget.data.escalationLevel == "Level 0") ||
                    (widget.caseAge >= 12 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 1") ||
                    (widget.caseAge >= 36 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 2") ||
                    (widget.caseAge >= 48 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 3") ||
                    (widget.caseAge >= 60 && timeFromLastEsc >= 2 && widget.data.escalationLevel == "Level 4")) {

                    domStyle.set(dom.byId(widget.escReasonDiv), "display", "block");
                    widget.submitBtn.set("disabled", false);
                } else {
                    domStyle.set(dom.byId(widget.exceptionDiv), "display", "block");
                    widget.showExceptionInfo(condition);
                }
                return;
            }
            else {
                domStyle.set(dom.byId(widget.noCriteriaDiv), "display", "block");
                widget.line3Span.innerHTML = "This Case does not meet the criteria to be escalated at this time.";
            }
        },
        setEscalationDetails: function () {
            var widget = this;
            var callback = function (obj) {
                if (obj.response.code == 200) {


                    widget.setWidgetValues(obj.data, widget.caseManagementWidget.domNode);

                }

            }
            widget.ctrl.getCaseDetails(widget.data.caseId, callback);
        },
        postCreate: function () {
            var widget = this;

            widget.escalationDialog.show();

            if (widget.data) {
                widget.escalationDialog.set("title", widget.escalationDialog.title + " - " + widget.data.caseNumber);
                widget.currEscLevel.set("value", widget.data.escalationLevel);
                widget.getCaseAge(widget.caseAge);
                domStyle.set(dom.byId(widget.curEscDiv), "display", "block");
                widget.submitBtn.set("disabled", true);
            }

            on(widget.closeBtn, "click", function () {
                widget.escalationDialog.destroyRecursive();
            });

            widget.reqCheck.on("click", function (evnt) {
                if (this.checked == true) {
                    widget.nextBtn.set("disabled", false);
                } else {
                    widget.nextBtn.set("disabled", true);
                }
            });

            on(widget.nextBtn, "click", function () {
                widget.data.escReqCheck = 1;
                widget.submitBtn.set("disabled", false);
                domStyle.set(dom.byId(widget.exceptionDiv), "display", "none");
                domStyle.set(dom.byId(widget.escReasonDiv), "display", "block");
            });

            on(widget.submitBtn, "click", function () {
                if (widget.data.escalationLevel == "Level 5") {
                    new messageWindow({
                        message: "Can't escalate. Current escalation level: Level 5 ",
                        title: "Note",
                        onOK: widget.escalationDialog.destroyRecursive()
                    });
                    return;
                }
                widget.data.escalationLevel = widget.getNextLevel(widget.data.escalationLevel);
                widget.data.escalationNote = widget.escReason.get("value");
                widget.data.escalationDate = widget.formatDateForEscalation(new Date(), "YYYY-MM-DD H24:MI:SS");
                var callback = function (obj) {
                    if (obj.response.code == 200) {
                        // widget.setEscalationDetails();
                        //widget.setWidgetValues(widget.data, widget.caseManagementWidget.domNode);
                        widget.escalationDialog.destroyRecursive();
                        new messageWindow({
                            message: "Your escalation request has been accepted and is now at " + widget.data.escalationLevel + " Please allow our team atleat 2 hours to address the escalation and respond",
                            title: "Success"
                        });
                    }
                };
                widget.ctrl.updateCase(widget.data, callback);
            });

        },
        formatDateForEscalation: function (date, format) {
            date = new Date(date.toLocaleString('en-US', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }));
            console.log(date);
            //console.log(new Date(date));
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();

            if (day < 10) {
                day = '0' + day;
            }
            if (month < 10) {
                month = '0' + month;
            }
            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }

            if (format == "YYYY-MM-DD") {
                return year + "-" + month + "-" + day;
            }

            if (format == "YYYY-MM-DD H24:MI:SS") {
                return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
            }

            if (format == "MM/DD/YYYY H24:MI:SS") {
                return month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
            }

            if (format == "MM-DD-YYYY") {
                return month + "-" + day + "-" + year;
            }

            return month + "/" + day + "/" + year;
        },
        destroy: function () {
            this.inherited(arguments);
        }
    });

});
