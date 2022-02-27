import { upload, boards } from './'
import { PortFilters } from './Serial'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[arduino-uploader]').forEach((el) => {
    el.addEventListener('click', async () => {
      if (!navigator.serial) return alert('Please enable the Web Serial API first: https://web.dev/serial/#use')
      const hexHref = el.getAttribute('hex-href')
      const board = el.getAttribute('board')
      const verify = el.hasAttribute('verify')
      const progressEl = el.querySelector('.upload-progress')
      const onProgress = (progress: number) => {
        progressEl.innerHTML = `${progress}%`
      }
      let portFilters = {} as PortFilters
      try {
        portFilters = { filters: JSON.parse(el.getAttribute('port-filters')) || [] }
      } catch (e) { }
      try {
        await upload(boards[board], hexHref, onProgress, verify, portFilters)
      } catch (e) {
        progressEl.innerHTML = 'Error!'
        alert(e)
        throw e
      }
      progressEl.innerHTML = 'Done!'
      console.log("Upload successful!\nEnvious? here's how https://github.com/dbuezas/arduino-web-uploader")
    })
  })
})
