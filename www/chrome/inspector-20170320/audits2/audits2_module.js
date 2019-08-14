Audits2.LighthouseResult;Audits2.WorkerResult;Audits2.Audits2Panel=class extends UI.Panel{constructor(){super('audits2');this.setHideOnDetach();this.registerRequiredCSS('audits2/audits2Panel.css');this._protocolService=new Audits2.ProtocolService();this._protocolService.registerStatusCallback(msg=>this._updateStatus(Common.UIString(msg)));this._settings=Audits2.Audits2Panel.Presets.map(preset=>{const setting=Common.settings.createSetting(preset.id,true);setting.setTitle(Common.UIString(preset.description));return setting;});var auditsViewElement=this.contentElement.createChild('div','hbox audits2-view');this._resultsView=this.contentElement.createChild('div','vbox results-view');auditsViewElement.createChild('div','audits2-logo');this._createLauncherUI(auditsViewElement);}
_reset(){this.contentElement.classList.remove('show-results');this._resultsView.removeChildren();}
_createLauncherUI(auditsViewElement){var uiElement=auditsViewElement.createChild('div');var headerElement=uiElement.createChild('header');headerElement.createChild('p').textContent=Common.UIString('Audits will analyze the page against modern development best practices and collect useful performance metrics and diagnostics. Select audits to collect:');uiElement.appendChild(headerElement);var auditSelectorForm=uiElement.createChild('form','audits2-form');this._settings.map(setting=>new UI.ToolbarSettingCheckbox(setting)).forEach(checkbox=>auditSelectorForm.appendChild(checkbox.element));this._startButton=UI.createTextButton(Common.UIString('Audit this page'),this._startButtonClicked.bind(this),'run-audit audit-btn');auditSelectorForm.appendChild(this._startButton);this._statusView=this._createStatusView(uiElement);}
_createStatusView(launcherUIElement){var statusView=launcherUIElement.createChild('div','audits2-status hbox hidden');statusView.createChild('span','icon');this._statusElement=createElement('p');statusView.appendChild(this._statusElement);this._updateStatus(Common.UIString('Loading...'));return statusView;}
_start(){this._inspectedURL=SDK.targetManager.mainTarget().inspectedURL();const aggregationIDs=this._settings.map(setting=>{const preset=Audits2.Audits2Panel.Presets.find(preset=>preset.id===setting.name);return{configID:preset.configID,value:setting.get()};}).filter(agg=>!!agg.value).map(agg=>agg.configID);return Promise.resolve().then(_=>this._protocolService.attach()).then(_=>{this._auditRunning=true;this._updateButton();this._updateStatus(Common.UIString('Loading...'));}).then(_=>this._protocolService.startLighthouse(this._inspectedURL,aggregationIDs)).then(workerResult=>{this._finish(workerResult);return this._stop();});}
_startButtonClicked(event){if(this._auditRunning){this._updateStatus(Common.UIString('Cancelling...'));this._stop();return;}
this._start();}
_updateButton(){this._startButton.textContent=this._auditRunning?Common.UIString('Cancel audit'):Common.UIString('Audit this page');this._startButton.classList.toggle('started',this._auditRunning);this._statusView.classList.toggle('hidden',!this._auditRunning);}
_updateStatus(statusMessage){this._statusElement.textContent=statusMessage;}
_stop(){return this._protocolService.detach().then(_=>{this._auditRunning=false;this._updateButton();if(this._inspectedURL!==SDK.targetManager.mainTarget().inspectedURL())
SDK.targetManager.mainTarget().pageAgent().navigate(this._inspectedURL);});}
_finish(workerResult){if(workerResult===null){this._updateStatus(Common.UIString('Auditing failed.'));return;}
this._resultsView.removeChildren();var url=workerResult.result.url;var timestamp=workerResult.result.generatedTime;this._createResultsBar(this._resultsView,url,timestamp);this._createIframe(this._resultsView,workerResult.blobUrl);this.contentElement.classList.add('show-results');}
_createIframe(resultsView,blobUrl){var iframeContainer=resultsView.createChild('div','iframe-container');var iframe=iframeContainer.createChild('iframe','fill');iframe.setAttribute('sandbox','allow-scripts allow-popups-to-escape-sandbox allow-popups');iframe.src=blobUrl;}
_createResultsBar(resultsView,url,timestamp){var elem=resultsView.createChild('div','results-bar hbox');elem.createChild('div','audits2-logo audits2-logo-small');var summaryElem=elem.createChild('div','audits2-summary');var reportFor=summaryElem.createChild('span');reportFor.createTextChild('Report for ');var urlElem=reportFor.createChild('b');urlElem.textContent=url;var timeElem=summaryElem.createChild('span');timeElem.textContent=`Generated at ${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`;var newAuditButton=UI.createTextButton(Common.UIString('New Audit'),this._reset.bind(this),'new-audit audit-btn');elem.appendChild(newAuditButton);}};Audits2.Audits2Panel.Preset;Audits2.Audits2Panel.Presets=[{id:'audits2_cat_pwa',configID:'pwa',description:'Progressive web app audits'},{id:'audits2_cat_perf',configID:'perf',description:'Performance metrics and diagnostics'},{id:'audits2_cat_best_practices',configID:'bp',description:'Modern web development best practices'},];Audits2.ProtocolService=class extends Common.Object{constructor(){super();this._rawConnection=null;this._backend=null;this._backendPromise=null;this._status=null;}
attach(){return SDK.targetManager.interceptMainConnection(this._dispatchProtocolMessage.bind(this)).then(rawConnection=>{this._rawConnection=rawConnection;});}
startLighthouse(inspectedURL,aggregationIDs){return this._send('start',{url:inspectedURL,aggregationIDs});}
detach(){return Promise.resolve().then(()=>this._send('stop')).then(()=>this._backend.dispose()).then(()=>{delete this._backend;delete this._backendPromise;return this._rawConnection.disconnect();});}
registerStatusCallback(callback){this._status=callback;}
_dispatchProtocolMessage(message){this._send('dispatchProtocolMessage',{message:message});}
_initWorker(){this._backendPromise=Services.serviceManager.createAppService('audits2_worker','Audits2Service',false).then(backend=>{if(this._backend)
return;this._backend=backend;this._backend.on('statusUpdate',result=>this._status(result.message));this._backend.on('sendProtocolMessage',result=>this._rawConnection.sendMessage(result.message));});}
_send(method,params){if(!this._backendPromise)
this._initWorker();return this._backendPromise.then(_=>this._backend.send(method,params));}};;Runtime.cachedResources["audits2/audits2Panel.css"]="/*\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\niframe {\n    width: 100%;\n    height: 100%;\n    flex-direction: column !important;\n    position: relative;\n    flex: auto;\n}\n\n.audits2-view {\n    max-width: 550px;\n    min-width: 334px;\n    align-self: center;\n    margin: 30px 20px;\n}\n\n.results-view {\n    display: none;\n    flex-wrap: nowrap;\n    justify-content: flex-start;\n    align-content: stretch;\n    align-items: stretch;\n}\n\n.show-results .audits2-view {\n    display: none;\n}\n\n.show-results .results-view {\n    display: flex;\n    flex: auto;\n}\n\n.results-bar {\n    flex: none;\n    align-self: auto;\n    border-bottom: 1px solid #cccccc;\n}\n\n.audits2-summary {\n    display: flex;\n    flex-direction: column;\n    flex-grow: 1;\n    padding: 6px;\n    line-height: 1.7;\n    align-self: center;\n}\n\n.audits2-summary span {\n    color: #b7b7b7;\n    display: block;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\n.audits2-summary span b {\n    font-weight: normal;\n    color: #636382;\n}\n\n.audits2-summary span:first-child {\n    color: inherit;\n    font-size: 110%;\n}\n\n.audits2-logo {\n    width: 100px;\n    height: 110px;\n    flex-shrink: 0;\n    background-repeat: no-repeat;\n    background-size: contain;\n    margin-top: 10px;\n    background-image: -webkit-image-set(\n        url(Images/audits_logo.png) 1x,\n        url(Images/audits_logo_2x.png) 2x);\n}\n\n.audits2-logo-small {\n    background-image: -webkit-image-set(\n        url(Images/audits_logo_bw.png) 1x,\n        url(Images/audits_logo_bw_2x.png) 2x);\n    height: 41px;\n    width: 42px;\n    align-self: center;\n    margin: 0 0 0 20px;\n    flex-shrink: 0;\n}\n\n.iframe-container {\n    flex: 1 1 auto;\n    align-self: auto;\n    position: relative;\n}\n\n.audits2-form label {\n    display: flex;\n}\n\n.audits2-form label div {\n    display: inline;\n}\n\nbutton.audit-btn {\n    display: inline-block;\n    color: white;\n    text-shadow: none;\n    padding: 6px 10px;\n    background-color: #4285f4 !important;\n    background-image: unset !important;\n    font-size: 11px;\n    box-shadow: none !important;\n}\n\nbutton.audit-btn:hover {\n    background-color: hsla(217, 89%, 58%, 1) !important;\n    color: white !important;\n}\n\nbutton.run-audit {\n    margin-top: 12px;\n}\nbutton.run-audit.started {\n    background-color: #ffffff !important;\n    color: gray;\n}\n\nbutton.run-audit.started:hover {\n    background-color: #eee !important;\n    color: gray !important;\n}\n\nbutton.new-audit {\n    align-self: center;\n    margin-right: 20px;\n}\n\n.audits2-status .icon {\n    width: 16px;\n    height: 16px;\n    margin-top: 10px;\n    margin-right: 4px;\n    animation: spinner-animation 1200ms linear infinite;\n    transform-origin: 50% 50%;\n    padding: 1px;\n}\n\n.audits2-status .icon::before {\n    display: inline-block;\n    border: 1px solid #1565C0;\n    border-radius: 7px;\n    width: 14px;\n    height: 14px;\n    content: \"\";\n    position: absolute;\n    box-sizing: border-box;\n}\n\n.audits2-status .icon::after {\n    display: inline-block;\n    width: 6px;\n    height: 7px;\n    background: white;\n    position: absolute;\n    content: \"\";\n}\n\n@keyframes spinner-animation {\n    from { transform: rotate(0); }\n    to { transform: rotate(360deg); }\n\n/*# sourceURL=audits2/audits2Panel.css */";