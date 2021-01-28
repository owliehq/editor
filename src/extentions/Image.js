import { Image as TiptapImage } from 'tiptap-extensions'
import { Plugin } from 'tiptap'
import OImageView from 'src/components/views/OImageView'

function getAttrs (dom) {
  let {
    width,
    height,
  } = dom.style

  width = width || dom.getAttribute('width') || null
  height = height || dom.getAttribute('height') || null

  return {
    src: dom.getAttribute('src') || '',
    caption: dom.getAttribute('caption') || '',
    ref: dom.getAttribute('ref') || '',
    width: width == null ? null : parseInt(width, 10),
    height: height == null ? null : parseInt(height, 10),
  }
}

function toDOM (node) {
  const {
    src,
    caption,
    ref,
    width,
    height,
  } = node.attrs

  const attrs = {
    src,
    caption,
    ref,
    width,
    height,
  }

  return [
    'img',
    attrs
  ]
}

export default class Image extends TiptapImage {

  get defaultOptions() {
    return {
      uploadFunction: null
    }
  }

  get schema () {
    return {
      attrs: {
        src: { default: '' },
        caption: { default: '' },
        ref: { default: '' },
        width: { default: null },
        height: { default: null },
      },
      inline: 'true',
      group: 'inline',
      draggable: true,
      parseDOM: [{
        tag: 'img[src]',
        getAttrs,
      }],
      toDOM,
    }
  }

  get view () {
    return OImageView
  }

  get plugins() {
    const upload = this.options.uploadFunction //this.uploadFunc

    console.log(upload)

    console.log(this.options)

    return [
      new Plugin({
        props: {
          handlePaste(view, event, slice) {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items
            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
                event.preventDefault()
                const { schema } = view.state
                const image = item.getAsFile()
                const reader = new FileReader()
                if (upload) {
                  upload(image).then(src => {
                    const node = schema.nodes.image.create({
                      src: src
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                  })
                } else {
                  reader.onload = readerEvent => {
                    const node = schema.nodes.image.create({
                      src: readerEvent.target.result
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                  }
                  reader.readAsDataURL(image)
                }
              }
            }
            return false
          },
          handleDOMEvents: {
            drop(view, event) {

              event.preventDefault()

              const hasFiles =
                event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length

              if (!hasFiles) {
                return
              }

              console.log('Fichiers présents', hasFiles)

              const images = Array.from(event.dataTransfer.files).filter((file) =>
                /image/i.test(file.type)
              )

              if (images.length === 0) {
                return
              }

              const { schema } = view.state
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })


              images.forEach(async (image) => {

                const reader = new FileReader()
                if (upload) {
                  const node = schema.nodes.image.create({
                    src: await upload(image)
                  })
                  const transaction = view.state.tr.insert(coordinates.pos, node)
                  view.dispatch(transaction)
                } else {
                  reader.onload = (readerEvent) => {
                    const node = schema.nodes.image.create({
                      src: readerEvent.target.result
                    })
                    const transaction = view.state.tr.insert(coordinates.pos, node)
                    view.dispatch(transaction)
                  }
                  reader.readAsDataURL(image)
                }
              })
            }
          }
        }
      })
    ]
  }
}
