import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([])

  console.log('new render', 'we have', images.length, 'images')

  const searchParams = new URLSearchParams(document.location.search)

  const isAuth = searchParams.get('auth')

  useEffect(() => {
    if (!isAuth) return

    let timerId = setTimeout(function syncImages() {
      console.log('syncImages')

      fetch('/sync-images')
        .then((response) => {
          console.log('sync response', response)

          if (response.status === 401) {
            window.location.href = '/'
          } else {
            timerId = setTimeout(syncImages, 5000)
          }
        })

      // console.log('new setTimeout syncImages')
      // timerId = setTimeout(syncImages, 5000)


    }, 5000)

    return () => {
      clearTimeout(timerId)
    }
    // setInterval(() => {
      
    //   fetch('/sync-images')
    //     .then((response) => {
    //       console.log('sync response', response)

    //       if (response.status === 401) {
    //         window.location.href = '/'
    //       }
    //     })
    //     // .catch((err) => {
    //     //   console.log('sync error', err)
          
    //     // })
    // }, 10000)
    
  }, [])

  useEffect(() => {
    if (!isAuth) return

    setInterval(() => {
      fetch('/get-images').then((result) => {
        return result.json()
      }).then((result) => {
        // console.log('files result', result)
        
        setImages(result)
      })
    }, 5000)

  }, [])

  if (isAuth && images.length === 0) {
    return <div className="App">Loading...</div>
  }

  if (images.length === 0) {
    return <div className="App"><a href="/login">Login</a></div>
  }

  return (
    <div className="App">
      We have {images.length} images
      <div className="images">
        {images.length > 0 && images.map((image, index) => {
          const src = '/images/' + image
          return <div className="image" key={index}><img src={src} /></div>
        })}
      </div>
    </div>
  );
}

export default App;
