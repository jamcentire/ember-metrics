import BaseAdapter from './base';
import objectTransforms from '../utils/object-transforms';
import removeFromDOM from '../utils/remove-from-dom';
import { assert } from '@ember/debug';
import { get, set } from '@ember/object';
import { assign } from '@ember/polyfills';

const { without, compact, isPresent } = objectTransforms;

export default BaseAdapter.extend({
  toStringExtension() {
    return 'Amplitude';
  },

  init() {
    const config = get(this, 'config');
    const { token, options } = config;

    assert(
      `[ember-metrics] You must pass a valid \`token\` to the ${this.toString()} adapter`,
      token
    );

    /* eslint-disable */
    (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
    ;r.type="text/javascript"
    ;r.integrity="sha384-d/yhnowERvm+7eCU79T/bYjOiMmq4F11ElWYLmt0ktvYEVgqLDazh4+gW9CKMpYW"
    ;r.crossOrigin="anonymous";r.async=true
    ;r.src="https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js"
    ;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
    console.log("[Amplitude] Error: could not load SDK")}}
    ;var i=t.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i)
    ;function s(e,t){e.prototype[t]=function(){
    this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
    var o=function(){this._q=[];return this}
    ;var a=["add","append","clearAll","prepend","set","setOnce","unset"]
    ;for(var u=0;u<a.length;u++){s(o,a[u])}n.Identify=o;var c=function(){this._q=[]
    ;return this}
    ;var l=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
    ;for(var p=0;p<l.length;p++){s(c,l[p])}n.Revenue=c
    ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId"]
    ;function v(e){function t(t){e[t]=function(){
    e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
    for(var n=0;n<d.length;n++){t(d[n])}}v(n);
    n.getInstance=function(e){
    e=(!e||e.length===0?"$default_instance":e).toLowerCase();
    if(!n._iq) {n._iq = {};}
    if(!n._iq.hasOwnProperty(e)){n._iq[e]={_q:[]};v(n._iq[e])}return n._iq[e]};
    e.amplitude=n})(window,document);
    /* eslint-enable */

    set(this, 'amplitudeInstance', window.amplitude.getInstance());
    this.amplitudeInstance.init(token, null, options || {});
  },

  identify(options = {}) {
    const compactedOptions = compact(options);
    const { distinctId } = compactedOptions;
    const props = without(compactedOptions, 'distinctId');
    const identity = new window.amplitude.Identify();

    assert(
      `[ember-metrics] [${this.toString()}] It appears you did not pass a distictId param to "identify". You will need to do so in order for the session to be tagged to a specific user.`,
      distinctId
    );

    if (distinctId) {
      this.amplitudeInstance.setUserId(distinctId);
    }

    for (const k in props) {
      identity.set(k, props[k]);
    }

    this.amplitudeInstance.identify(identity);
    this.amplitudeInstance.logEvent('Identify');
  },

  trackEvent(options = {}) {
    const compactedOptions = compact(options);
    const { event } = compactedOptions;
    const props = without(compactedOptions, 'event');

    if (isPresent(props)) {
      this.amplitudeInstance.logEvent(event, props);
    } else {
      this.amplitudeInstance.logEvent(event);
    }
  },

  trackPage(options = {}) {
    const eventOpt = { event: 'Page View' };
    const withEvent = assign(eventOpt, options);

    this.trackEvent(withEvent);
  },

  optOut() {
    this.amplitudeInstance.setOptOut(true);
  },

  optIn() {
    this.amplitudeInstance.setOptOut(false);
  },

  willDestroy() {
    removeFromDOM('script[src*="amplitude"]');

    delete window.amplitude;
  }
});
