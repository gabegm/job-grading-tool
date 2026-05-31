import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const appElement = document.getElementById('app')
if (appElement) {
  mount(App, { target: appElement })
} else {
  console.error('#app element not found in DOM')
}
