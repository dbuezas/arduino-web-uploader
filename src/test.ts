import { upload, boards } from './'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[arduino-uploader]').forEach((el) => {
    el.addEventListener('click', async () => {
      const hexHref = el.getAttribute('hex-href')
      const board = el.getAttribute('board')
      const verify = el.hasAttribute('verify')
      const progressEl = el.querySelector('.upload-progress')
      const onProgress = (progress: number) => {
        progressEl.innerHTML = `${progress}%`
      }
      try {
        await upload(boards[board], hexHref, onProgress, verify)
      } catch (e) {
        progressEl.innerHTML = 'error'
        alert(e)
      }
    })
  })
})
