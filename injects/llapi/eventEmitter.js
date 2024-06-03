/*
 * @Date: 2024-01-17 16:32:39
 * @LastEditors: Night-stars-1 nujj1042633805@gmail.com
 * @LastEditTime: 2024-01-17 16:32:46
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }
    
    once(eventName, listener) {
        const onceListener = (...args) => {
            listener(...args);
            this.off(eventName, onceListener);
        };
        this.on(eventName, onceListener);
    }

    off(eventName, listener) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(fn => fn !== listener);
        }
    }

    emit(event, ...args) {
        const listeners = this.events[event];
        if (listeners) {
            listeners.forEach(listener => {
                listener(...args);
            });
        }
    }
}