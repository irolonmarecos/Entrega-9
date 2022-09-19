const express = require('express');

const {Server:SocketServer} = require('socket.io')
const {Server:HTTPServer} = require('http');

const app = express();
const handlebars = require('express-handlebars');
const events = require('./public/js/sockets_events');
const httpServer = new HTTPServer(app);
const socketServer = new SocketServer(httpServer);
const routerProductos = require('./routes/productos-test')

const {mensaje} = require('./schema/mensajes')
const MensajeMongo = require('./DAOs/mensajes')
const nvoMsj = new MensajeMongo
const connection = require('./dataBase')
connection()

const hbs = handlebars.create({
    extname:'.hbs',
    defaultLayout:'index.hbs',
    layoutsDir: __dirname + '/public/views/layout',
}) 

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use('/test/productos', routerProductos)

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './public/views');



socketServer.on('connection', async(socket)=>{
    const totalMensajes = await nvoMsj.getAll();
    console.log(totalMensajes);
    socketServer.emit(events.TOTAL_MENSAJES, totalMensajes)
    socket.on(events.ENVIAR_MENSAJE, async(msg)=>{
        const MENSAJE = new mensaje(msg)
        const result = await nvoMsj.save(MENSAJE)
        console.log(result);
        console.log(msg.author.nombre);
        socketServer.sockets.emit(events.NUEVO_MENSAJE, msg)
    })
    const pesoNormMsjs = JSON.stringify(totalMensajes).length / 1024
    console.log(pesoNormMsjs);

    socketServer.sockets.emit('porcentaje', totalMensajes, pesoNormMsjs)
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, ()=>{
    console.log(`El servidor se esta ejecutando en el puerto ${PORT}`);
})