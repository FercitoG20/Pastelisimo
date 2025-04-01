import React, { useState, useEffect , useCallback} from 'react';
import {View, TextInput,TouchableOpacity,Text,ImageBackground,Image,StyleSheet,Alert,ScrollView,FlatList,Button,RefreshControl,Linking,ActivityIndicator,Platform
} from 'react-native';
import DatePicker from "react-datepicker";
import DateTimePicker from '@react-native-community/datetimepicker';
import "react-datepicker/dist/react-datepicker.css"; 
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { collection, addDoc, updateDoc, doc, getDocs, deleteDoc, onSnapshot,writeBatch, increment } from 'firebase/firestore';
import { db } from './firebase'; 
import { useFocusEffect } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native'; 
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';




const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const Iniciosesion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMensaje, setErrorMensaje] = useState('');
  const navigation = useNavigation();

  const validarUsuario = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      navigation.replace('MenuPrincipal');
    } catch (error) {
      setErrorMensaje('⚠️ Contraseña o correo incorrecto');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/8a/f7/3a/8af73a1102af1cd42daea141e9c0ca19.jpg',
      }}
      style={estilos.fondo}>
      <View style={estilos.cuadrologin}>
        <Image source={require('./assets/logo.png')} style={estilos.logo} />
        <Text style={estilos.titulo}>🍰 Pastelisimo Admin 🧁</Text>

        <Text style={estilos.login}>Correo</Text>
        <View style={estilos.bordes}>
          <TextInput
            style={estilos.texto}
            placeholder="📧 "
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={estilos.login}>Contraseña</Text>
        <View style={estilos.bordes}>
          <TextInput
            style={estilos.texto}
            placeholder="🔑"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {errorMensaje ? (
          <Text style={estilos.error}>{errorMensaje}</Text>
        ) : null}

        <TouchableOpacity style={estilos.iniciar} onPress={validarUsuario}>
          <Text style={estilos.iniciarTexto}>Ingresar a la pastelería</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.footerLogin}>
        <Text style={estilos.textoFooterLogin}>
          © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
          Realizado por Fernando Javier Luna Vázquez
        </Text>

        <View style={estilos.contenedorRedesLogin}>
          <TouchableOpacity
            style={estilos.botonRedSocialLogin}
            onPress={() =>
              Linking.openURL(
                'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
              )
            }>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
              }}
              style={estilos.iconoRedSocialLogin}
            />
            <Text style={estilos.textoRedSocialLogin}>@pastelisimo2025</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.botonRedSocialLogin}
            onPress={() =>
              Linking.openURL(
                'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
              )
            }>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
              }}
              style={estilos.iconoRedSocialLogin}
            />
            <Text style={estilos.textoRedSocialLogin}>/Pastelisimo2025</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export const GestionPedidos = ({ navigation }) => {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProductos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'productos'));
      const productosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosData);
    } catch (error) {
      console.log('Error al obtener productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  const fetchPedidos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pedidos'));
      const pedidosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPedidos(pedidosData);
    } catch (error) {
      console.log('Error al obtener pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProductos();
      fetchPedidos();
    }, [])
  );

  const getProductoById = (id) =>
    productos.find((producto) => producto.id === id);

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado });
      fetchPedidos();
      Alert.alert('Éxito', 'Estado del pedido actualizado');
    } catch (error) {
      console.log('Error al actualizar pedido:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const marcarEntregado = async (pedido) => {
    try {
      console.log('Iniciando proceso de marcado como entregado...');

      if (pedido.estado === 'Entregado') {
        Alert.alert('Información', 'Este pedido ya está entregado');
        return;
      }

      const producto = getProductoById(pedido.productoId) || {};
      console.log('Producto asociado:', producto);

      const fechaEntrega = new Date().toISOString().split('T')[0];
      const batch = writeBatch(db);

      const pedidoRef = doc(db, 'pedidos', pedido.id);
      batch.update(pedidoRef, {
        estado: 'Entregado',
        fechaEntrega: fechaEntrega,
      });

      if (pedido.productoId && pedido.piezas) {
        const productoRef = doc(db, 'productos', pedido.productoId);
        batch.update(productoRef, {
          stock: increment(-Number(pedido.piezas)),
        });
      }

      await batch.commit();
      console.log('Pedido actualizado como entregado con éxito');

      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p.id === pedido.id ? { ...p, estado: 'Entregado' } : p
        )
      );

      Alert.alert('Éxito', 'Pedido marcado como entregado');
      fetchPedidos();
    } catch (error) {
      console.error('Error completo:', error);
      Alert.alert(
        'Error',
        `No se pudo marcar el pedido como entregado: ${error.message}`
      );
      fetchPedidos();
    }
  };

  const eliminarPedido = async (id) => {
    try {
      await deleteDoc(doc(db, 'pedidos', id));
      fetchPedidos();
      Alert.alert('Éxito', 'Pedido eliminado correctamente');
    } catch (error) {
      console.log('Error al eliminar pedido:', error);
      Alert.alert('Error', 'No se pudo eliminar el pedido');
    }
  };

  const filtrarPedidos = (estado) => {
    setEstadoSeleccionado(estado);
  };

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleEstado =
      estadoSeleccionado === 'todos' || pedido.estado === estadoSeleccionado;
    const cumpleBusqueda = pedido.cliente
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/99/49/25/994925c4f5b5e4379ce48e31f1c45323.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <View style={estilos.contenedorFiltros}>
          <View style={estilos.contenedorBusqueda}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3917/3917376.png',
              }}
              style={estilos.iconoBuscar}
            />
            <TextInput
              style={estilos.inputBusqueda}
              placeholder="Buscar cliente..."
              placeholderTextColor="#8E6C88"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              style={[
                estilos.botonFiltro,
                estadoSeleccionado === 'todos' && estilos.botonFiltroActivo,
              ]}
              onPress={() => filtrarPedidos('todos')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
                }}
                style={estilos.iconoFiltro}
              />
              <Text style={estilos.textoBotonFiltro}>Todos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botonFiltro,
                estadoSeleccionado === 'Cancelado' && estilos.botonFiltroActivo,
              ]}
              onPress={() => filtrarPedidos('Cancelado')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/484/484662.png',
                }}
                style={estilos.iconoFiltro}
              />
              <Text style={estilos.textoBotonFiltro}>Cancelados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botonFiltro,
                estadoSeleccionado === 'Entregado' && estilos.botonFiltroActivo,
              ]}
              onPress={() => filtrarPedidos('Entregado')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                }}
                style={estilos.iconoFiltro}
              />
              <Text style={estilos.textoBotonFiltro}>Entregados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonAgregar}
              onPress={() => navigation.navigate('AgregarPedido')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2997/2997933.png',
                }}
                style={estilos.iconoAgregar}
              />
              <Text style={estilos.textoBotonAgregar}>Nuevo Pedido</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={estilos.contenedorPedidos}
          showsVerticalScrollIndicator={false}>
          {pedidosFiltrados.length > 0 ? (
            pedidosFiltrados.map((item) => {
              const producto = getProductoById(item.productoId);
              return (
                <View key={item.id} style={estilos.cardPedido}>
                  <View style={estilos.encabezadoPedido}>
                    <Image
                      source={
                        item.fotoCliente
                          ? { uri: item.fotoCliente }
                          : {
                              uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                            }
                      }
                      style={estilos.fotoCliente}
                    />
                    <View style={estilos.infoCliente}>
                      <Text style={estilos.nombreCliente}>
                        {item.cliente || 'Cliente no especificado'}
                      </Text>
                      <View style={estilos.detalleCliente}>
                        <Image
                          source={{
                            uri: 'https://cdn-icons-png.flaticon.com/128/7524/7524766.png',
                          }}
                          style={estilos.iconoDetalle}
                        />
                        <Text style={estilos.textoDetalle}>
                          {item.telefono || 'Sin teléfono'}
                        </Text>
                      </View>
                      <View style={estilos.detalleCliente}>
                        <Image
                          source={{
                            uri: 'https://cdn-icons-png.flaticon.com/128/6129/6129053.png',
                          }}
                          style={estilos.iconoDetalle}
                        />
                        <Text style={estilos.textoDetalle}>
                          {item.correo || 'Sin correo'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        estilos.estadoPedido,
                        item.estado === 'En proceso' && {
                          backgroundColor: '#FFD166',
                        },
                        item.estado === 'Listo' && {
                          backgroundColor: '#06D6A0',
                        },
                        item.estado === 'Entregado' && {
                          backgroundColor: '#118AB2',
                        },
                        item.estado === 'Cancelado' && {
                          backgroundColor: '#EF476F',
                        },
                      ]}>
                      <Text style={estilos.textoEstado}>
                        {item.estado || 'Sin estado'}
                      </Text>
                    </View>
                  </View>

                  <View style={estilos.contenedorProducto}>
                    {producto && (
                      <>
                        <Image
                          source={{
                            uri:
                              producto.imagen ||
                              'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                          }}
                          style={estilos.imagenProducto}
                        />
                        <View style={estilos.infoProducto}>
                          <Text style={estilos.nombreProducto}>
                            {producto.nombre || 'Producto no especificado'}
                          </Text>
                          <View style={estilos.detalleProducto}>
                            <Image
                              source={{
                                uri: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
                              }}
                              style={estilos.iconoDetalle}
                            />
                            <Text style={estilos.textoDetalle}>
                              Piezas: {item.piezas || '0'}
                            </Text>
                          </View>
                          <View style={estilos.detalleProducto}>
                            <Image
                              source={{
                                uri: 'https://cdn-icons-png.flaticon.com/512/2667/2667259.png',
                              }}
                              style={estilos.iconoDetalle}
                            />
                            <Text style={estilos.textoDetalle}>
                              Precio: ${producto.precio || '0'}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={estilos.contenedorFechas}>
                    <View style={estilos.fechaContainer}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png',
                        }}
                        style={estilos.iconoFecha}
                      />
                      <Text style={estilos.textoFecha}>
                        Realizado: {item.fecha || 'No especificada'}
                      </Text>
                    </View>
                    <View style={estilos.fechaContainer}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
                        }}
                        style={estilos.iconoFecha}
                      />
                      <Text style={estilos.textoFecha}>
                        Entrega: {item.fechaLimite || 'No especificada'}
                      </Text>
                    </View>
                  </View>

                  <View style={estilos.contenedorTotal}>
                    <Text style={estilos.textoTotal}>Total:</Text>
                    <Text style={estilos.total}>${item.total || '0'}</Text>
                  </View>

                  <View style={estilos.contenedorBotones}>
                    <TouchableOpacity
                      style={estilos.botonAccionEliminar}
                      onPress={() => eliminarPedido(item.id)}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/484/484662.png',
                        }}
                        style={estilos.iconoAccion}
                      />
                      <Text style={estilos.textoAccion}>Eliminar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={estilos.botonAccionEntregado}
                      onPress={() => marcarEntregado(item)}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                        }}
                        style={estilos.iconoAccion}
                      />
                      <Text style={estilos.textoAccion}>Entregado</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={estilos.botonAccionEditar}
                      onPress={() =>
                        navigation.navigate('AgregarPedido', { pedido: item })
                      }>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828911.png',
                        }}
                        style={estilos.iconoAccion}
                      />
                      <Text style={estilos.textoAccion}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={estilos.botonAccionCancelar}
                      onPress={() => actualizarEstado(item.id, 'Cancelado')}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828926.png',
                        }}
                        style={estilos.iconoAccion}
                      />
                      <Text style={estilos.textoAccion}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={estilos.sinPedidos}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076478.png',
                }}
                style={estilos.iconoSinPedidos}
              />
              <Text style={estilos.textoSinPedidos}>
                No hay pedidos en esta categoría
              </Text>
            </View>
          )}

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export const AgregarPedido = ({ navigation, route }) => {
  const pedidoEditado = route.params?.pedido || null;
  const [productos, setProductos] = useState([]);
  const [nuevoPedido, setNuevoPedido] = useState({
    cliente: pedidoEditado ? pedidoEditado.cliente : '',
    telefono: pedidoEditado ? pedidoEditado.telefono : '',
    correo: pedidoEditado ? pedidoEditado.correo : '',
    direccion: pedidoEditado ? pedidoEditado.direccion : '',
    fecha: pedidoEditado
      ? pedidoEditado.fecha
      : new Date().toISOString().split('T')[0],
    productoId: pedidoEditado ? pedidoEditado.productoId : '',
    piezas: pedidoEditado ? pedidoEditado.piezas : 0,
    total: pedidoEditado ? pedidoEditado.total : 0,
    fechaLimite: pedidoEditado ? pedidoEditado.fechaLimite : '',
    estado: pedidoEditado ? pedidoEditado.estado : 'En proceso',
  });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'productos'));
        const productosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProductos(productosData);
      } catch (error) {
        console.log('Error al obtener productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    const productoSeleccionado = productos.find(
      (producto) => producto.id === nuevoPedido.productoId
    );
    const piezas =
      isNaN(nuevoPedido.piezas) || nuevoPedido.piezas <= 0
        ? 0
        : nuevoPedido.piezas;

    if (productoSeleccionado) {
      const total = productoSeleccionado.precio * piezas;
      setNuevoPedido((prevState) => ({
        ...prevState,
        total: total,
        piezas: piezas,
      }));
    }
  }, [nuevoPedido.piezas, nuevoPedido.productoId, productos]);

  const guardarPedido = async () => {
    if (!nuevoPedido.cliente.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del cliente');
      return;
    }

    if (!nuevoPedido.productoId) {
      Alert.alert('Error', 'Por favor selecciona un producto');
      return;
    }

    const pedidoConDefaults = {
      cliente: nuevoPedido.cliente,
      telefono: nuevoPedido.telefono || 'No disponible',
      correo: nuevoPedido.correo || 'No disponible',
      direccion: nuevoPedido.direccion || 'No disponible',
      fecha: nuevoPedido.fecha || new Date().toISOString().split('T')[0],
      productoId: nuevoPedido.productoId,
      piezas: nuevoPedido.piezas || 0,
      total: nuevoPedido.total || 0,
      fechaLimite: nuevoPedido.fechaLimite || '',
      estado: 'En proceso',
    };

    try {
      if (pedidoEditado) {
        await updateDoc(
          doc(db, 'pedidos', pedidoEditado.id),
          pedidoConDefaults
        );
        Alert.alert('Éxito', 'Pedido actualizado correctamente');
      } else {
        await addDoc(collection(db, 'pedidos'), pedidoConDefaults);
        Alert.alert('Éxito', 'Pedido creado correctamente');
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error al guardar pedido:', error);
      Alert.alert('Error', 'No se pudo guardar el pedido');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/a9/e7/00/a9e700c5256e42ca66eb8ba12c1060b0.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={estilos.contenedorFormulario}
          showsVerticalScrollIndicator={false}>
          <View style={estilos.cardFormulario}>
            <View style={estilos.encabezadoFormulario}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454183.png',
                }}
                style={estilos.iconoFormulario}
              />
              <Text style={estilos.tituloFormulario}>
                {pedidoEditado ? 'Editar Pedido' : 'Nuevo Pedido'}
              </Text>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Datos del Cliente</Text>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Nombre del cliente"
                  value={nuevoPedido.cliente}
                  onChangeText={(text) =>
                    setNuevoPedido({ ...nuevoPedido, cliente: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/7524/7524766.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Teléfono"
                  value={nuevoPedido.telefono}
                  onChangeText={(text) =>
                    setNuevoPedido({ ...nuevoPedido, telefono: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/6129/6129053.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Correo electrónico"
                  value={nuevoPedido.correo}
                  onChangeText={(text) =>
                    setNuevoPedido({ ...nuevoPedido, correo: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="email-address"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/3203/3203071.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Dirección"
                  value={nuevoPedido.direccion}
                  onChangeText={(text) =>
                    setNuevoPedido({ ...nuevoPedido, direccion: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Detalles del Pedido</Text>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png',
                  }}
                  style={estilos.iconoInput}
                />
                {Platform.OS === 'web' ? (
                  <DatePicker
                    selected={new Date(nuevoPedido.fecha)}
                    onChange={(date) =>
                      setNuevoPedido({
                        ...nuevoPedido,
                        fecha: date.toISOString().split('T')[0],
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="react-datepicker__input"
                    style={estilos.datePickerWeb}
                  />
                ) : (
                  <DateTimePicker
                    value={new Date(nuevoPedido.fecha)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const currentDate =
                        selectedDate || new Date(nuevoPedido.fecha);
                      setNuevoPedido({
                        ...nuevoPedido,
                        fecha: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    style={estilos.datePickerMobile}
                  />
                )}
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/992/992700.png',
                  }}
                  style={estilos.iconoInput}
                />
                <Picker
                  selectedValue={nuevoPedido.productoId}
                  onValueChange={(itemValue) =>
                    setNuevoPedido({ ...nuevoPedido, productoId: itemValue })
                  }
                  style={estilos.picker}
                  dropdownIconColor="#8E6C88">
                  <Picker.Item label="Selecciona un producto" value="" />
                  {productos.map((producto) => (
                    <Picker.Item
                      key={producto.id}
                      label={producto.nombre}
                      value={producto.id}
                    />
                  ))}
                </Picker>
              </View>

              {nuevoPedido.productoId && (
                <View style={estilos.previsualizacionProducto}>
                  {productos
                    .filter(
                      (producto) => producto.id === nuevoPedido.productoId
                    )
                    .map((producto) => (
                      <Image
                        key={producto.id}
                        source={{
                          uri:
                            producto.imagen ||
                            'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                        }}
                        style={estilos.imagenProducto}
                      />
                    ))}
                </View>
              )}

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/3050/3050020.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Ingrese cantidad"
                  value={nuevoPedido.piezas.toString()}
                  onChangeText={(text) => {
                    setNuevoPedido({
                      ...nuevoPedido,
                      piezas: text.replace(/[^0-9]/g, ''),
                    });
                  }}
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="numeric"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/128/2769/2769269.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Total"
                  value={`$${nuevoPedido.total}`}
                  style={estilos.input}
                  editable={false}
                  placeholderTextColor="#8E6C88"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png',
                  }}
                  style={estilos.iconoInput}
                />
                {Platform.OS === 'web' ? (
                  <DatePicker
                    selected={
                      nuevoPedido.fechaLimite
                        ? new Date(nuevoPedido.fechaLimite)
                        : new Date()
                    }
                    onChange={(date) =>
                      setNuevoPedido({
                        ...nuevoPedido,
                        fechaLimite: date.toISOString().split('T')[0],
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="react-datepicker__input"
                    style={estilos.datePickerWeb}
                  />
                ) : (
                  <DateTimePicker
                    value={
                      nuevoPedido.fechaLimite
                        ? new Date(nuevoPedido.fechaLimite)
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const currentDate =
                        selectedDate || new Date(nuevoPedido.fechaLimite);
                      setNuevoPedido({
                        ...nuevoPedido,
                        fechaLimite: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    style={estilos.datePickerMobile}
                  />
                )}
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/2089/2089678.png',
                  }}
                  style={estilos.iconoInput}
                />
                <Text style={[estilos.input, { paddingVertical: 10 }]}>
                  En proceso
                </Text>
              </View>
            </View>

            <View style={estilos.contenedorBotones}>
              <TouchableOpacity
                style={estilos.botonGuardar}
                onPress={guardarPedido}>
                <Text style={estilos.textoBotonGuardar}>Guardar Pedido</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonCancelar}
                onPress={() => navigation.goBack()}>
                <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const MenuHorizontal = ({ navigation, setCategoriaSeleccionada }) => {
  const botones = [
    {
      label: 'Inventario',
      type: 'inventario',
      icon: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
    },
    {
      label: 'Gelatinas',
      type: 'categoria',
      icon: 'https://cdn-icons-png.flaticon.com/512/3144/3144465.png',
    },
    {
      label: 'Pasteles',
      type: 'categoria',
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992700.png',
    },
    {
      label: 'Postres',
      type: 'categoria',
      icon: 'https://cdn-icons-png.flaticon.com/512/3144/3144476.png',
    },
    {
      label: 'Galletas',
      type: 'categoria',
      icon: 'https://cdn-icons-png.flaticon.com/512/3144/3144488.png',
    },
    {
      label: 'Agregar',
      type: 'navegacion',
      icon: 'https://cdn-icons-png.flaticon.com/512/2997/2997933.png',
    },
  ];

  const buttonColors = {
    Gelatinas: '#FF9AA2',
    Pasteles: '#FFB7B2',
    Postres: '#FFDAC1',
    Galletas: '#E2F0CB',
    Inventario: '#B5EAD7',
    Agregar: '#C7CEEA',
  };

  return (
    <View style={estilos.contenedorMenu}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.scrollCategorias}
        bounces={false}>
        {botones.map((boton, index) => (
          <TouchableOpacity
            key={index}
            style={[
              estilos.botonCategoria,
              { backgroundColor: buttonColors[boton.label] },
            ]}
            onPress={() => {
              if (boton.type === 'categoria') {
                if (setCategoriaSeleccionada) {
                  setCategoriaSeleccionada(boton.label);
                } else {
                  navigation.navigate('GestionInventario', {
                    categoria: boton.label,
                  });
                }
              } else if (boton.type === 'inventario') {
                if (setCategoriaSeleccionada) {
                  setCategoriaSeleccionada(null);
                } else {
                  navigation.navigate('GestionInventario', { categoria: null });
                }
              } else if (boton.type === 'navegacion') {
                navigation.navigate('AgregarProducto');
              }
            }}>
            <Image
              source={{ uri: boton.icon }}
              style={estilos.iconoBotonCategoria}
            />
            <Text style={estilos.textoBotonCategoria}>{boton.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const GestionInventario = ({ navigation, route }) => {
  const [productos, setProductos] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const fetchProductos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'productos'));
      const productosData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosData);
    } catch (error) {
      console.log('Error al obtener productos:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProductos();
    }, [])
  );

  useEffect(() => {
    if (route.params?.categoria !== undefined) {
      setCategoriaSeleccionada(route.params.categoria);
    }
  }, [route.params?.categoria]);

  const eliminarProducto = async (id) => {
    try {
      await deleteDoc(doc(db, 'productos', id));
      fetchProductos();
      Alert.alert('Éxito', 'Producto eliminado correctamente');
    } catch (error) {
      console.log('Error al eliminar producto:', error);
      Alert.alert('Error', 'No se pudo eliminar el producto');
    }
  };

  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria === categoriaSeleccionada)
    : productos;

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/03/19/a1/0319a10ebee74a816296a671609936f5.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <MenuHorizontal
          navigation={navigation}
          setCategoriaSeleccionada={setCategoriaSeleccionada}
        />

        <ScrollView
          contentContainerStyle={estilos.contenedorProductos}
          showsVerticalScrollIndicator={false}>
          {categoriaSeleccionada && (
            <View style={estilos.encabezadoCategoria}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454183.png',
                }}
                style={estilos.iconoCategoria}
              />
              <Text style={estilos.tituloCategoria}>
                {categoriaSeleccionada}
              </Text>
            </View>
          )}

          {productosFiltrados.length > 0 ? (
            productosFiltrados.map((item) => (
              <View key={item.id} style={estilos.cardProducto}>
                <Image
                  source={{
                    uri:
                      item.imagen ||
                      'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                  }}
                  style={estilos.imagenProducto}
                />
                <View style={estilos.infoProducto}>
                  <Text style={estilos.nombreProducto}>{item.nombre}</Text>
                  <View style={estilos.detalleProducto}>
                    <Image
                      source={{
                        uri: 'https://cdn-icons-png.flaticon.com/512/2965/2965300.png',
                      }}
                      style={estilos.iconoDetalle}
                    />
                    <Text style={estilos.textoDetalle}>${item.precio}</Text>
                  </View>
                  <View style={estilos.detalleProducto}>
                    <Image
                      source={{
                        uri: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
                      }}
                      style={estilos.iconoDetalle}
                    />
                    <Text style={estilos.textoDetalle}>
                      {item.stock} disponibles
                    </Text>
                  </View>
                  <Text style={estilos.categoriaProducto}>
                    {item.categoria}
                  </Text>
                </View>
                <View style={estilos.botonesProducto}>
                  <TouchableOpacity
                    style={estilos.botonAccionEditar}
                    onPress={() =>
                      navigation.navigate('AgregarProducto', { producto: item })
                    }>
                    <Image
                      source={{
                        uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828911.png',
                      }}
                      style={estilos.iconoAccion}
                    />
                    <Text style={estilos.textoAccion}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={estilos.botonAccionEliminar}
                    onPress={() => eliminarProducto(item.id)}>
                    <Image
                      source={{
                        uri: 'https://cdn-icons-png.flaticon.com/512/484/484662.png',
                      }}
                      style={estilos.iconoAccion}
                    />
                    <Text style={estilos.textoAccion}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={estilos.sinProductos}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076478.png',
                }}
                style={estilos.iconoSinProductos}
              />
              <Text style={estilos.textoSinProductos}>
                No hay productos en esta categoría
              </Text>
            </View>
          )}

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export const AgregarProducto = ({ navigation, route }) => {
  const productoEditado = route.params?.producto || null;

  const [producto, setProducto] = useState({
    nombre: productoEditado ? productoEditado.nombre : '',
    precio: productoEditado ? productoEditado.precio : 0,
    stock: productoEditado ? productoEditado.stock : 0,
    categoria: productoEditado ? productoEditado.categoria : 'Pasteles',
    imagen: productoEditado ? productoEditado.imagen : '',
  });

  const categorias = ['Gelatinas', 'Pasteles', 'Postres', 'Galletas'];

  const seleccionarImagen = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true },
      (response) => {
        if (response.assets && response.assets.length > 0) {
          setProducto({
            ...producto,
            imagen: response.assets[0].uri,
          });
        }
      }
    );
  };

  const guardarProducto = async () => {
    if (!producto.nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el producto');
      return;
    }

    try {
      if (productoEditado) {
        await updateDoc(doc(db, 'productos', productoEditado.id), producto);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await addDoc(collection(db, 'productos'), producto);
        Alert.alert('Éxito', 'Producto agregado correctamente');
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error al guardar producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/a9/e7/00/a9e700c5256e42ca66eb8ba12c1060b0.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={estilos.contenedorFormulario}
          showsVerticalScrollIndicator={false}>
          <View style={estilos.cardFormulario}>
            <View style={estilos.encabezadoFormulario}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454183.png',
                }}
                style={estilos.iconoFormulario}
              />
              <Text style={estilos.tituloFormulario}>
                {productoEditado ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Nombre del producto</Text>
              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3917/3917132.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Ej. Pastel de Chocolate"
                  value={producto.nombre}
                  onChangeText={(text) =>
                    setProducto({ ...producto, nombre: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Imagen del producto</Text>
              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/709/709624.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="URL de la imagen"
                  value={producto.imagen}
                  onChangeText={(text) =>
                    setProducto({ ...producto, imagen: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
              <TouchableOpacity
                onPress={seleccionarImagen}
                style={estilos.botonImagen}>
                <Text style={estilos.textoBotonImagen}>Seleccionar imagen</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/2965/2965338.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
            </View>

            {producto.imagen ? (
              <Image
                source={{ uri: producto.imagen }}
                style={estilos.previsualizacionImagen}
              />
            ) : (
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                }}
                style={estilos.previsualizacionImagen}
              />
            )}

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Precio ($)</Text>
              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/2667/2667259.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="0.00"
                  value={producto.precio ? String(producto.precio) : ''}
                  onChangeText={(text) =>
                    setProducto({ ...producto, precio: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Stock disponible</Text>
              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="0"
                  value={producto.stock ? String(producto.stock) : ''}
                  onChangeText={(text) =>
                    setProducto({ ...producto, stock: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Categoría</Text>
              <View style={[estilos.inputContainer, { height: 50 }]}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3502/3502689.png',
                  }}
                  style={estilos.iconoInput}
                />
                <Picker
                  selectedValue={producto.categoria}
                  onValueChange={(itemValue) =>
                    setProducto({ ...producto, categoria: itemValue })
                  }
                  style={estilos.picker}
                  dropdownIconColor="#8E6C88">
                  {categorias.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={estilos.contenedorBotones}>
              <TouchableOpacity
                style={estilos.botonGuardar}
                onPress={guardarProducto}>
                <Text style={estilos.textoBotonGuardar}>Guardar</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonCancelar}
                onPress={() => navigation.goBack()}>
                <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const ApartadosDashboard = () => {
  const navigation = useNavigation();
  const [apartados, setApartados] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const fetchApartados = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'apartados'));
      const lista = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setApartados(lista);
    } catch (error) {
      console.error('Error al cargar apartados:', error);
      Alert.alert('Error', 'No se pudieron cargar los apartados');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApartados();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchApartados().then(() => setRefreshing(false));
  };

  const registrarAccion = async (id, accion) => {
    try {
      const registro = {
        apartadoId: id,
        accion,
        fecha: new Date().toISOString(),
      };
      await addDoc(collection(db, 'bitacora'), registro);
    } catch (error) {
      console.error('Error al registrar acción:', error);
    }
  };

  const confirmarApartado = async (apartado) => {
    try {
      await updateDoc(doc(db, 'apartados', apartado.id), {
        estado: 'Confirmado',
      });
      Alert.alert('Confirmado', `Apartado de ${apartado.cliente} confirmado.`);
      registrarAccion(apartado.id, 'Confirmado');

      setApartados((prevState) =>
        prevState.map((item) =>
          item.id === apartado.id ? { ...item, estado: 'Confirmado' } : item
        )
      );

      if (apartado.productoId && apartado.cantidad) {
        await updateDoc(doc(db, 'productos', apartado.productoId), {
          stock: increment(-apartado.cantidad),
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar el apartado.');
    }
  };

  const enviarRecordatorio = async (apartado) => {
    try {
      await Promise.resolve();
      console.log('Recordatorio enviado para el apartado:', apartado);
      Alert.alert('Recordatorio', 'El recordatorio se ha enviado');
      registrarAccion(apartado.id, 'Recordatorio enviado');
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      Alert.alert('Error', 'No se pudo enviar el recordatorio.');
    }
  };

  const cancelarApartado = async (apartado) => {
    try {
      await updateDoc(doc(db, 'apartados', apartado.id), {
        estado: 'Cancelado',
      });
      Alert.alert('Cancelado', `Apartado de ${apartado.cliente} cancelado.`);
      registrarAccion(apartado.id, 'Cancelado');
      setApartados((prevState) =>
        prevState.map((item) =>
          item.id === apartado.id ? { ...item, estado: 'Cancelado' } : item
        )
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo cancelar el apartado.');
    }
  };

  const marcarEntregado = async (apartado) => {
    try {
      await updateDoc(doc(db, 'apartados', apartado.id), {
        estado: 'Entregado',
      });
      registrarAccion(apartado.id, 'Entregado');
      setApartados((prevState) =>
        prevState.map((item) =>
          item.id === apartado.id ? { ...item, estado: 'Entregado' } : item
        )
      );
      Alert.alert(
        'Entregado',
        `El apartado de ${apartado.cliente} se marcó como entregado.`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar como entregado.');
    }
  };

  const eliminarApartado = async (id) => {
    try {
      await deleteDoc(doc(db, 'apartados', id));
      Alert.alert('Eliminado', 'Apartado eliminado correctamente.');
      registrarAccion(id, 'Eliminado');
      setApartados((prevState) => prevState.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el apartado.');
    }
  };

  const apartadosFiltrados = apartados.filter((ap) => {
    const cumpleEstado = filtroEstado === 'Todos' || ap.estado === filtroEstado;
    const cumpleBusqueda =
      ap.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      (ap.producto &&
        ap.producto.toLowerCase().includes(busqueda.toLowerCase()));
    return cumpleEstado && cumpleBusqueda;
  });

  const totalApartados = apartados.length;
  const pendientes = apartados.filter((ap) => ap.estado === 'Pendiente').length;
  const confirmados = apartados.filter(
    (ap) => ap.estado === 'Confirmado'
  ).length;
  const entregados = apartados.filter((ap) => ap.estado === 'Entregado').length;
  const cancelados = apartados.filter((ap) => ap.estado === 'Cancelado').length;

  const renderApartado = ({ item }) => (
    <View style={estilos.cardApartado}>
      <View
        style={[
          estilos.estadoContainer,
          item.estado === 'Pendiente' && { backgroundColor: '#FFD166' },
          item.estado === 'Confirmado' && { backgroundColor: '#06D6A0' },
          item.estado === 'Entregado' && { backgroundColor: '#118AB2' },
          item.estado === 'Cancelado' && { backgroundColor: '#EF476F' },
        ]}>
        <Text style={estilos.textoEstado}>{item.estado}</Text>
      </View>

      <View style={estilos.clienteContainer}>
        <Image
          source={
            item.clienteImagen
              ? { uri: item.clienteImagen }
              : {
                  uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                }
          }
          style={estilos.clienteImagen}
        />
        <View style={estilos.clienteInfo}>
          <Text style={estilos.nombreCliente}>{item.cliente}</Text>
          <View style={estilos.detalleCliente}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3616/3616930.png',
              }}
              style={estilos.iconoDetalle}
            />
            <Text style={estilos.textoDetalle}>
              {item.telefono || 'Sin teléfono'}
            </Text>
          </View>
          <View style={estilos.detalleCliente}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
              }}
              style={estilos.iconoDetalle}
            />
            <Text style={estilos.textoDetalle}>
              {item.correo || 'Sin correo'}
            </Text>
          </View>
        </View>
      </View>
      <View style={estilos.productoContainer}>
        <Image
          source={
            item.productoImagen
              ? { uri: item.productoImagen }
              : {
                  uri: 'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                }
          }
          style={estilos.productoImagen}
        />
        <View style={estilos.productoInfo}>
          <Text style={estilos.nombreProducto}>{item.producto}</Text>
          <View style={estilos.detalleProducto}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
              }}
              style={estilos.iconoDetalle}
            />
            <Text style={estilos.textoDetalle}>Cantidad: {item.cantidad}</Text>
          </View>
          <View style={estilos.detalleProducto}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2667/2667259.png',
              }}
              style={estilos.iconoDetalle}
            />
            <Text style={estilos.textoDetalle}>Total: ${item.total || 0}</Text>
          </View>
        </View>
      </View>

      <View style={estilos.fechasContainer}>
        <View style={estilos.fechaItem}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png',
            }}
            style={estilos.iconoFecha}
          />
          <Text style={estilos.textoFecha}>Apartado: {item.fechaApartado}</Text>
        </View>
        <View style={estilos.fechaItem}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
            }}
            style={estilos.iconoFecha}
          />
          <Text style={estilos.textoFecha}>Límite: {item.fechaLimite}</Text>
        </View>
      </View>

      <View style={estilos.botonesContainer}>
        <TouchableOpacity
          style={estilos.botonAccionConfirmar}
          onPress={() => confirmarApartado(item)}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Confirmar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonAccionRecordar}
          onPress={() => enviarRecordatorio(item)}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/2948/2948037.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Recordar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonAccionEntregar}
          onPress={() => marcarEntregado(item)}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Entregar</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.botonesContainer}>
        <TouchableOpacity
          style={estilos.botonAccionEditar}
          onPress={() =>
            navigation.navigate('AgregarApartado', { apartado: item })
          }>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828271.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonAccionCancelar}
          onPress={() => cancelarApartado(item)}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonAccionEliminar}
          onPress={() => eliminarApartado(item.id)}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/484/484662.png',
            }}
            style={estilos.iconoAccion}
          />
          <Text style={estilos.textoAccion}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/71/0c/91/710c91ff031bc4de875eabf8926edec3.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={estilos.container}>
        <View style={estilos.topStatic}>
          <View style={estilos.barraBusqueda}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3917/3917376.png',
              }}
              style={estilos.iconoBuscar}
            />
            <TextInput
              style={estilos.inputBusqueda}
              placeholder="Buscar cliente o producto..."
              placeholderTextColor="#8E6C88"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={estilos.filtrosContainer}
              style={{ flex: 1 }}>
              {[
                'Todos',
                'Pendiente',
                'Confirmado',
                'Entregado',
                'Cancelado',
              ].map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[
                    estilos.botonFiltro,
                    estado === filtroEstado && estilos.botonFiltroActivo,
                    estado === 'Pendiente' && { backgroundColor: '#FFD166' },
                    estado === 'Confirmado' && { backgroundColor: '#06D6A0' },
                    estado === 'Entregado' && { backgroundColor: '#118AB2' },
                    estado === 'Cancelado' && { backgroundColor: '#EF476F' },
                  ]}
                  onPress={() => setFiltroEstado(estado)}>
                  <Image
                    source={{
                      uri:
                        estado === 'Todos'
                          ? 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png'
                          : estado === 'Pendiente'
                          ? 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png'
                          : estado === 'Confirmado'
                          ? 'https://cdn-icons-png.flaticon.com/512/190/190411.png'
                          : estado === 'Entregado'
                          ? 'https://cdn-icons-png.flaticon.com/512/190/190411.png'
                          : 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                    }}
                    style={estilos.iconoFiltro}
                  />
                  <Text style={estilos.textoFiltro}>{estado}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={estilos.botonAgregar}
              onPress={() => navigation.navigate('AgregarApartado')}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2997/2997933.png',
                }}
                style={estilos.iconoAgregar}
              />
              <Text style={estilos.textoAgregar}>Nuevo Apartado</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.estadisticasContainer}>
            {[
              {
                tipo: 'Total',
                valor: totalApartados,
                icono:
                  'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
                color: '#8E6C88',
              },
              {
                tipo: 'Pendientes',
                valor: pendientes,
                icono:
                  'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
                color: '#FFD166',
              },
              {
                tipo: 'Confirmados',
                valor: confirmados,
                icono: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                color: '#06D6A0',
              },
              {
                tipo: 'Entregados',
                valor: entregados,
                icono: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                color: '#118AB2',
              },
              {
                tipo: 'Cancelados',
                valor: cancelados,
                icono: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                color: '#EF476F',
              },
            ].map((estadistica, index) => (
              <View
                key={index}
                style={[
                  estilos.tarjetaEstadistica,
                  { backgroundColor: estadistica.color },
                ]}>
                <Image
                  source={{ uri: estadistica.icono }}
                  style={estilos.iconoEstadistica}
                />
                <Text style={estilos.estadisticaNumero}>
                  {estadistica.valor}
                </Text>
                <Text style={estilos.estadisticaTexto}>{estadistica.tipo}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          style={estilos.scrollableContent}
          contentContainerStyle={estilos.scrollContentContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}>
          <FlatList
            data={apartadosFiltrados}
            renderItem={renderApartado}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={estilos.listaVacia}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076478.png',
                  }}
                  style={estilos.iconoListaVacia}
                />
                <Text style={estilos.textoListaVacia}>
                  No hay apartados en esta categoría
                </Text>
              </View>
            }
            contentContainerStyle={estilos.listaContainer}
          />

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const AgregarApartado = ({ navigation, route }) => {
  const estados = ['Pendiente'];
  const apartadoEditado = route.params?.apartado || null;
  const [productos, setProductos] = useState([]);
  const [nuevoApartado, setNuevoApartado] = useState({
    cliente: apartadoEditado ? apartadoEditado.cliente : '',
    telefono: apartadoEditado ? apartadoEditado.telefono : '',
    correo: apartadoEditado ? apartadoEditado.correo : '',
    direccion: apartadoEditado ? apartadoEditado.direccion : '',
    fecha: apartadoEditado
      ? apartadoEditado.fecha
      : new Date().toISOString().split('T')[0],
    productoId: apartadoEditado ? apartadoEditado.productoId : '',
    piezas: apartadoEditado ? apartadoEditado.piezas : 0,
    total: apartadoEditado ? apartadoEditado.total : 0,
    fechaLimite: apartadoEditado ? apartadoEditado.fechaLimite : '',
    estado: apartadoEditado ? apartadoEditado.estado : estados[0],
  });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'productos'));
        const productosData = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProductos(productosData);
      } catch (error) {
        console.log('Error al obtener productos:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    const productoSeleccionado = productos.find(
      (producto) => producto.id === nuevoApartado.productoId
    );
    const piezas =
      isNaN(nuevoApartado.piezas) || nuevoApartado.piezas <= 0
        ? 0
        : nuevoApartado.piezas;
    if (productoSeleccionado) {
      const total = productoSeleccionado.precio * piezas;
      setNuevoApartado((prevState) => ({
        ...prevState,
        total,
        piezas,
      }));
    }
  }, [nuevoApartado.piezas, nuevoApartado.productoId, productos]);

  const guardarApartado = async () => {
    if (!nuevoApartado.cliente.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del cliente');
      return;
    }

    if (!nuevoApartado.productoId) {
      Alert.alert('Error', 'Por favor selecciona un producto');
      return;
    }

    const productoSeleccionado = productos.find(
      (p) => p.id === nuevoApartado.productoId
    );
    const apartadoConDefaults = {
      cliente: nuevoApartado.cliente,
      telefono: nuevoApartado.telefono || 'No disponible',
      correo: nuevoApartado.correo || 'No disponible',
      direccion: nuevoApartado.direccion || 'No disponible',
      fecha: nuevoApartado.fecha || new Date().toISOString().split('T')[0],
      productoId: nuevoApartado.productoId,
      producto: productoSeleccionado
        ? productoSeleccionado.nombre
        : 'Producto no especificado',
      productoImagen: productoSeleccionado ? productoSeleccionado.imagen : null,
      cantidad: nuevoApartado.piezas || 0,
      total: nuevoApartado.total || 0,
      fechaLimite: nuevoApartado.fechaLimite || '',
      estado: nuevoApartado.estado || estados[0],
    };

    try {
      if (apartadoEditado) {
        await updateDoc(
          doc(db, 'apartados', apartadoEditado.id),
          apartadoConDefaults
        );
        Alert.alert('Éxito', 'Apartado actualizado correctamente');
      } else {
        await addDoc(collection(db, 'apartados'), apartadoConDefaults);
        Alert.alert('Éxito', 'Apartado creado correctamente');
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error al guardar apartado:', error);
      Alert.alert('Error', 'No se pudo guardar el apartado');
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/a9/e7/00/a9e700c5256e42ca66eb8ba12c1060b0.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenedorFormulario}>
          <View style={estilos.cardFormulario}>
            <View style={estilos.encabezadoFormulario}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454183.png',
                }}
                style={estilos.iconoFormulario}
              />
              <Text style={estilos.tituloFormulario}>
                {apartadoEditado ? 'Editar Apartado' : 'Nuevo Apartado'}
              </Text>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Datos del Cliente</Text>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Nombre del cliente"
                  value={nuevoApartado.cliente}
                  onChangeText={(text) =>
                    setNuevoApartado({ ...nuevoApartado, cliente: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3616/3616930.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Teléfono"
                  value={nuevoApartado.telefono}
                  onChangeText={(text) =>
                    setNuevoApartado({ ...nuevoApartado, telefono: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Correo electrónico"
                  value={nuevoApartado.correo}
                  onChangeText={(text) =>
                    setNuevoApartado({ ...nuevoApartado, correo: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="email-address"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/484/484613.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Dirección"
                  value={nuevoApartado.direccion}
                  onChangeText={(text) =>
                    setNuevoApartado({ ...nuevoApartado, direccion: text })
                  }
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                />
              </View>
            </View>

            <View style={estilos.grupoFormulario}>
              <Text style={estilos.label}>Detalles del Apartado</Text>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/747/747310.png',
                  }}
                  style={estilos.iconoInput}
                />
                {Platform.OS === 'web' ? (
                  <DatePicker
                    selected={new Date(nuevoApartado.fecha)}
                    onChange={(date) =>
                      setNuevoApartado({
                        ...nuevoApartado,
                        fecha: date.toISOString().split('T')[0],
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="react-datepicker__input"
                    style={estilos.datePickerWeb}
                  />
                ) : (
                  <DateTimePicker
                    value={new Date(nuevoApartado.fecha)}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const currentDate =
                        selectedDate || new Date(nuevoApartado.fecha);
                      setNuevoApartado({
                        ...nuevoApartado,
                        fecha: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    style={estilos.datePickerMobile}
                  />
                )}
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/992/992700.png',
                  }}
                  style={estilos.iconoInput}
                />
                <Picker
                  selectedValue={nuevoApartado.productoId}
                  onValueChange={(itemValue) =>
                    setNuevoApartado({
                      ...nuevoApartado,
                      productoId: itemValue,
                    })
                  }
                  style={estilos.picker}
                  dropdownIconColor="#8E6C88">
                  <Picker.Item label="Selecciona un producto" value="" />
                  {productos.map((producto) => (
                    <Picker.Item
                      key={producto.id}
                      label={producto.nombre}
                      value={producto.id}
                    />
                  ))}
                </Picker>
              </View>

              {nuevoApartado.productoId && (
                <View style={estilos.previsualizacionProducto}>
                  {productos
                    .filter(
                      (producto) => producto.id === nuevoApartado.productoId
                    )
                    .map((producto) => (
                      <Image
                        key={producto.id}
                        source={{
                          uri:
                            producto.imagen ||
                            'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                        }}
                        style={estilos.imagenProducto}
                      />
                    ))}
                </View>
              )}

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Cantidad"
                  value={String(nuevoApartado.piezas)}
                  onChangeText={(text) => {
                    const piezas = text === '' ? '' : parseInt(text, 10);
                    setNuevoApartado({ ...nuevoApartado, piezas: piezas });
                  }}
                  style={estilos.input}
                  placeholderTextColor="#8E6C88"
                  keyboardType="numeric"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/2667/2667259.png',
                  }}
                  style={estilos.iconoInput}
                />
                <TextInput
                  placeholder="Total"
                  value={`$${nuevoApartado.total}`}
                  style={estilos.input}
                  editable={false}
                  placeholderTextColor="#8E6C88"
                />
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
                  }}
                  style={estilos.iconoInput}
                />
                {Platform.OS === 'web' ? (
                  <DatePicker
                    selected={
                      nuevoApartado.fechaLimite
                        ? new Date(nuevoApartado.fechaLimite)
                        : new Date()
                    }
                    onChange={(date) =>
                      setNuevoApartado({
                        ...nuevoApartado,
                        fechaLimite: date.toISOString().split('T')[0],
                      })
                    }
                    dateFormat="yyyy-MM-dd"
                    className="react-datepicker__input"
                    style={estilos.datePickerWeb}
                  />
                ) : (
                  <DateTimePicker
                    value={
                      nuevoApartado.fechaLimite
                        ? new Date(nuevoApartado.fechaLimite)
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      const currentDate =
                        selectedDate || new Date(nuevoApartado.fechaLimite);
                      setNuevoApartado({
                        ...nuevoApartado,
                        fechaLimite: currentDate.toISOString().split('T')[0],
                      });
                    }}
                    style={estilos.datePickerMobile}
                  />
                )}
              </View>

              <View style={estilos.inputContainer}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/2089/2089678.png',
                  }}
                  style={estilos.iconoInput}
                />
                <Picker
                  selectedValue={nuevoApartado.estado}
                  onValueChange={(itemValue) =>
                    setNuevoApartado({ ...nuevoApartado, estado: itemValue })
                  }
                  style={estilos.picker}
                  dropdownIconColor="#8E6C88">
                  {estados.map((estado) => (
                    <Picker.Item key={estado} label={estado} value={estado} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={estilos.contenedorBotones}>
              <TouchableOpacity
                style={estilos.botonGuardar}
                onPress={guardarApartado}>
                <Text style={estilos.textoBotonGuardar}>Guardar Apartado</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonCancelar}
                onPress={() => navigation.goBack()}>
                <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                  }}
                  style={estilos.iconoBoton}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export const AnalisisReportes = () => {
  const [cargando, setCargando] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [gananciaTotal, setGananciaTotal] = useState(0);

  // Escuchar cambios en tiempo real de ambas colecciones
  useEffect(() => {
    setCargando(true);

    const unsubscribeApartados = onSnapshot(
      collection(db, 'apartados'),
      (apartadosSnapshot) => {
        const unsubscribePedidos = onSnapshot(
          collection(db, 'pedidos'),
          (pedidosSnapshot) => {
            let entregados = [];
            let totalGanancia = 0;

            apartadosSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.estado === 'Entregado') {
                entregados.push({ id: doc.id, ...data });
                totalGanancia += parseFloat(data.total || 0);
              }
            });

            pedidosSnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.estado === 'Entregado') {
                if (!entregados.some((item) => item.id === doc.id)) {
                  entregados.push({
                    id: doc.id,
                    ...data,
                    producto: data.productoNombre || 'Producto no especificado',
                    fechaApartado:
                      data.fecha || new Date().toISOString().split('T')[0],
                  });
                  totalGanancia += parseFloat(data.total || 0);
                }
              }
            });

            entregados.sort(
              (a, b) =>
                new Date(b.fechaEntrega || b.fechaApartado) -
                new Date(a.fechaEntrega || a.fechaApartado)
            );

            setReportes(entregados);
            setGananciaTotal(totalGanancia);
            setCargando(false);
          },
          (error) => {
            console.error('Error al escuchar pedidos:', error);
            setCargando(false);
          }
        );

        return () => unsubscribePedidos();
      },
      (error) => {
        console.error('Error al escuchar apartados:', error);
        setCargando(false);
      }
    );

    return () => unsubscribeApartados();
  }, []);

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/a9/e7/00/a9e700c5256e42ca66eb8ba12c1060b0.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={estilos.container}>
        <View style={estilos.encabezado}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/2454/2454183.png',
            }}
            style={estilos.iconoTitulo}
          />
          <Text style={estilos.titulo}>Análisis y Reportes</Text>
        </View>

        <View style={estilos.tarjetaResumen}>
          <Text style={estilos.textoResumen}>Ganancias Totales</Text>
          <Text style={estilos.gananciaTotal}>${gananciaTotal.toFixed(2)}</Text>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
            }}
            style={estilos.iconoGanancias}
          />
        </View>

        {cargando ? (
          <View style={estilos.cargandoContainer}>
            <ActivityIndicator size="large" color="#8E6C88" />
            <Text style={estilos.textoCargando}>Cargando reportes...</Text>
          </View>
        ) : (
          <ScrollView style={estilos.listaContainer}>
            {reportes.length > 0 ? (
              reportes.map((reporte, index) => (
                <View key={index} style={estilos.cardReporte}>
                  <View style={estilos.encabezadoReporte}>
                    <Text style={estilos.totalReporte}>
                      ${reporte.total || 0}
                    </Text>
                    <Text style={estilos.fechaReporte}>
                      {reporte.fechaApartado || reporte.fecha}
                    </Text>
                  </View>

                  <View style={estilos.detalleReporte}>
                    <View style={estilos.detalleItem}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/3737/3737728.png',
                        }}
                        style={estilos.iconoDetalle}
                      />
                      <Text style={estilos.textoDetalle}>
                        {reporte.producto || reporte.productoNombre}
                      </Text>
                    </View>

                    <View style={estilos.detalleItem}>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                        }}
                        style={estilos.iconoDetalle}
                      />
                      <Text style={estilos.textoDetalle}>
                        {reporte.cliente}
                      </Text>
                    </View>

                    {reporte.tipo === 'pedido' && (
                      <View style={estilos.detalleItem}>
                        <Image
                          source={{
                            uri: 'https://cdn-icons-png.flaticon.com/512/102/102279.png',
                          }}
                          style={estilos.iconoDetalle}
                        />
                        <Text style={estilos.textoDetalle}>
                          Pedido a domicilio
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={estilos.listaVacia}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076478.png',
                  }}
                  style={estilos.iconoListaVacia}
                />
                <Text style={estilos.textoListaVacia}>
                  No hay entregas registradas
                </Text>
              </View>
            )}

            <View style={estilos.footer}>
              <Text style={estilos.textoFooter}>
                © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
                Realizado por Fernando Javier Luna Vázquez
              </Text>
              <Image
                source={require('./assets/pastelito.png')}
                style={estilos.iconoSprinkles}
              />
              <View style={estilos.contenedorRedes}>
                <TouchableOpacity
                  style={estilos.botonRedSocial}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                    )
                  }>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                    }}
                    style={estilos.iconoRedSocial}
                  />
                  <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={estilos.botonRedSocial}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                    )
                  }>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                    }}
                    style={estilos.iconoRedSocial}
                  />
                  <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
};

export const AtencionCliente = () => {
  const [mensajes, setMensajes] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'mensajes'));
        const data = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() });
        });
        setMensajes(data);
        setLoading(false);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los mensajes.');
        setLoading(false);
      }
    };

    fetchMensajes();

    const interval = setInterval(() => {
      fetchMensajes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPreguntas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'preguntas'));
        const data = [];
        querySnapshot.forEach((docSnap) => {
          data.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPreguntas(data);
      } catch (error) {
        console.error('Error al cargar las preguntas frecuentes:', error);
      }
    };

    fetchPreguntas();
  }, []);

  const enviarRespuesta = async () => {
    if (mensajeSeleccionado && respuesta.trim() !== '') {
      try {
        const messageRef = doc(db, 'mensajes', mensajeSeleccionado.id);
        await updateDoc(messageRef, { respuesta });
        setMensajes(
          mensajes.map((m) =>
            m.id === mensajeSeleccionado.id ? { ...m, respuesta } : m
          )
        );
        setMensajeSeleccionado(null);
        setRespuesta('');
        Alert.alert('Éxito', 'Respuesta enviada correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo enviar la respuesta.');
      }
    } else {
      Alert.alert('Atención', 'Por favor, escribe una respuesta.');
    }
  };

  const eliminarMensaje = async (id) => {
    try {
      await deleteDoc(doc(db, 'mensajes', id));
      setMensajes(mensajes.filter((m) => m.id !== id));
      Alert.alert('Éxito', 'Mensaje eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el mensaje.');
    }
  };

  const eliminarPregunta = async (id) => {
    try {
      await deleteDoc(doc(db, 'preguntas', id));
      setPreguntas(preguntas.filter((p) => p.id !== id));
      Alert.alert('Éxito', 'Pregunta eliminada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la pregunta.');
    }
  };

  const mensajesFiltrados = mensajes.filter(
    (m) =>
      m.mensaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={estilos.fondoPasteleria}>
        <ActivityIndicator size="large" color="#FF6B8B" />
        <Text style={estilos.textoCargando}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/0f/65/3c/0f653cfd0bf8672adf03ac88983086bb.jpg',
      }}
      style={estilos.fondoPasteleria}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={estilos.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <View style={estilos.header}>
            <Text style={estilos.tituloPrincipal}>
              Dulce Atención al Cliente
            </Text>
          </View>

          <View style={estilos.contenedorBuscador}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3917/3917376.png',
              }}
              style={estilos.iconoBuscar}
            />
            <TextInput
              style={estilos.inputPastel}
              placeholder="Buscar mensaje o cliente..."
              placeholderTextColor="#8E6C88"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {mensajesFiltrados.map((m) => (
            <View key={m.id} style={estilos.cardPastel}>
              <View style={estilos.encabezadoCard}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
                  }}
                  style={estilos.iconoCliente}
                />
                <Text style={estilos.infoCliente}>Cliente: {m.cliente}</Text>
              </View>

              <View style={estilos.contenedorMensaje}>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/542/542638.png',
                  }}
                  style={estilos.iconoMensaje}
                />
                <Text style={estilos.textoMensaje}>{m.mensaje}</Text>
              </View>

              {m.respuesta ? (
                <View style={estilos.contenedorRespuesta}>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/1047/1047711.png',
                    }}
                    style={estilos.iconoRespuesta}
                  />
                  <Text style={estilos.textoRespuesta}>{m.respuesta}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={estilos.botonResponder}
                  onPress={() => setMensajeSeleccionado(m)}>
                  <Text style={estilos.textoBoton}>Responder</Text>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/3682/3682321.png',
                    }}
                    style={estilos.iconoBoton}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={estilos.botonEliminar}
                onPress={() => eliminarMensaje(m.id)}>
                <Text style={estilos.textoBotonEliminar}>Eliminar</Text>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/3221/3221897.png',
                  }}
                  style={estilos.iconoEliminar}
                />
              </TouchableOpacity>

              {mensajeSeleccionado && mensajeSeleccionado.id === m.id && (
                <View style={estilos.contenedorFormularioRespuesta}>
                  <TextInput
                    style={estilos.inputRespuesta}
                    placeholder="Escribe tu respuesta..."
                    value={respuesta}
                    onChangeText={setRespuesta}
                    placeholderTextColor="#8E6C88"
                    multiline
                  />
                  <View style={estilos.contenedorBotones}>
                    <TouchableOpacity
                      style={estilos.botonEnviar}
                      onPress={enviarRespuesta}>
                      <Text style={estilos.textoBotonEnviar}>Enviar</Text>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/3682/3682321.png',
                        }}
                        style={estilos.iconoBoton}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={estilos.botonCancelar}
                      onPress={() => {
                        setMensajeSeleccionado(null);
                        setRespuesta('');
                      }}>
                      <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
                      <Image
                        source={{
                          uri: 'https://cdn-icons-png.flaticon.com/512/753/753345.png',
                        }}
                        style={estilos.iconoBoton}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => Linking.openURL('tel:+522226897100')}
            style={estilos.botonContacto}>
            <View style={estilos.contenedorContacto}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/3059/3059518.png',
                }}
                style={estilos.iconoContacto}
              />
              <Text style={estilos.textoContacto}>
                ¡Llama para más información! {'\n'}
                +52 222 689 7100
              </Text>
            </View>
          </TouchableOpacity>

          <View style={estilos.contenedorPreguntas}>
            <View style={estilos.encabezadoPreguntas}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    'mailto:pastelisimo2025@gmail.com?subject=Queja&body=Escribe tu mensaje aquí'
                  )
                }
                style={estilos.botonContacto}>
                <View style={estilos.contenedorContacto}>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/128/732/732200.png',
                    }}
                    style={estilos.iconoPreguntas}
                  />
                  <Text style={estilos.tituloPreguntas}>
                    O contactanos por correo.{' '}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {preguntas.map((p) => (
              <View key={p.id} style={estilos.cardPregunta}>
                <View style={estilos.contenedorPregunta}>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/1006/1006363.png',
                    }}
                    style={estilos.iconoInterrogacion}
                  />
                  <Text style={estilos.textoPregunta}>{p.pregunta}</Text>
                </View>
                {p.respuesta && (
                  <View style={estilos.contenedorRespuestaPregunta}>
                    <Image
                      source={{
                        uri: 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png',
                      }}
                      style={estilos.iconoCheck}
                    />
                    <Text style={estilos.textoRespuestaPregunta}>
                      {p.respuesta}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={estilos.botonEliminarPregunta}
                  onPress={() => eliminarPregunta(p.id)}>
                  <Text style={estilos.textoBotonEliminarPregunta}>
                    Eliminar
                  </Text>
                  <Image
                    source={{
                      uri: 'https://cdn-icons-png.flaticon.com/512/3221/3221897.png',
                    }}
                    style={estilos.iconoEliminarPregunta}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={estilos.footer}>
            <Text style={estilos.textoFooter}>
              © 2025 El Pastelisimo. Todos los derechos reservados.{'\n'}
              Realizado por Fernando Javier Luna Vázquez
            </Text>
            <Image
              source={require('./assets/pastelito.png')}
              style={estilos.iconoSprinkles}
            />
            <View style={estilos.contenedorRedes}>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.instagram.com/pastelisimo2025?igsh=NjZpMHUwMm1nbjBs'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>@pastelisimo2025</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.botonRedSocial}
                onPress={() =>
                  Linking.openURL(
                    'https://www.facebook.com/share/18Sr4oAR97/?mibextid=wwXIfr'
                  )
                }>
                <Image
                  source={{
                    uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
                  }}
                  style={estilos.iconoRedSocial}
                />
                <Text style={estilos.textoRedSocial}>/Pastelisimo2025</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export const Usuario = ({ navigation }) => {
  return (
    <ImageBackground
      source={{
        uri: 'https://i.pinimg.com/736x/43/43/32/434332f5fc71ba6d06fb0f46c85346a4.jpg',
      }}
      style={estilos.fondoUsuario}>
      <View style={estilos.cuadrologinUsuario}>
        <Text style={estilos.tituloUsuario}>Mi cuenta Pastelisimo</Text>
        <Image
          source={require('./assets/logo.png')}
          style={estilos.logoUsuario}
        />

        <Text style={estilos.loginUsuario}>Correo</Text>
        <View style={estilos.bordesUsuario}>
          <TextInput
            style={estilos.textoUsuario}
            placeholder="👤"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={estilos.loginUsuario}>Contraseña</Text>
        <View style={estilos.bordesUsuario}>
          <TextInput
            style={estilos.textoUsuario}
            placeholder="🔒"
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity style={estilos.iniciarUsuario}>
          <Text style={estilos.iniciarTextoUsuario}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Contraseña')}>
          <Text style={estilos.azullUsuario}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('CrearCuenta')}>
          <Text style={estilos.azulllUsuario}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

function ApartadosStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ApartadosDashboard" component={ApartadosDashboard} />
      <Stack.Screen name="AgregarApartado" component={AgregarApartado} />
    </Stack.Navigator>
  );
}

function InventarioStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestionInventario" component={GestionInventario} />
      <Stack.Screen name="AgregarProducto" component={AgregarProducto} />
    </Stack.Navigator>
  );
}

function PedidosStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestionPedidos" component={GestionPedidos} />
      <Stack.Screen name="AgregarPedido" component={AgregarPedido} />
    </Stack.Navigator>
  );
}

function SalirScreen({ navigation }) {
  useEffect(() => {
    navigation.replace('Login');
  }, [navigation]);

  return null;
}

function DrawerNavigator() {
  const navigation = useNavigation();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffb6c1', // Rosa pastel suave
          height: 120,
        },
        headerTintColor: '#fff', // Texto blanco
        drawerStyle: {
          backgroundColor: '#fff0f5', // Fondo rosa muy claro para el drawer
        },
        drawerActiveTintColor: '#d23c6d', // Rosa fuerte para el ítem activo
        drawerInactiveTintColor: '#ff85a2', // Rosa pastel para ítems inactivos
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Usuario')}>
            <Image
              source={require('./assets/logo.png')}
              style={{
                width: 100,
                height: 50,
                marginRight: 10,
                borderRadius: 35,
              }}
            />
          </TouchableOpacity>
        ),
      }}>
      <Drawer.Screen
        name="Gestión de Pedidos"
        component={PedidosStackNavigator}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="cupcake" size={20} color={color} /> // Icono de pastel
          ),
        }}
      />
      <Drawer.Screen
        name="Gestión de Apartados"
        component={ApartadosStackNavigator}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="calendar-check" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Gestión de Productos e Inventario"
        component={InventarioStackNavigator}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="clipboard-list" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Análisis y Reportes"
        component={AnalisisReportes}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="chart-pie" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Atención al Cliente"
        component={AtencionCliente}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="headset" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Salir"
        component={SalirScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="exit-to-app" size={20} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Iniciosesion} />
      <Stack.Screen name="MenuPrincipal" component={DrawerNavigator} />
      <Stack.Screen name="Usuario" component={Usuario} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}

const estilos = StyleSheet.create({
  // ────── Estilos Generales ──────
  fondo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 110,
    bottom: 30,
    borderRadius: 30,
  },
  cuadrologin: {
    bottom: 3,
    width: 350,
    height: 470,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    padding: 10,
    borderWidth: 4,
    borderColor: '#FBCFE8',
    shadowColor: '#E879F9',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    elevation: 10,
  },
  bordes: {
    width: '100%',
    height: 40,
    borderColor: '#F9A8D4',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: '#FDF2F8',
  },
  texto: {
    padding: 10,
    color: '#7E22CE',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#7E22CE',
    marginBottom: 20,
    bottom: -110,
    textShadowColor: '#FBCFE8',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  login: {
    padding: 5,
    color: '#9333EA',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  iniciar: {
    backgroundColor: '#C084FC',
    paddingVertical: 7,
    paddingHorizontal: 40,
    borderRadius: 35,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
  },
  iniciarTexto: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  derechos: {
    position: 'absolute',
    bottom: 10,
    textAlign: 'center',
    color: '#7E22CE',
    fontSize: 10,
    paddingHorizontal: 20,
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ────── Footer ──────
  footerLogin: {
    width: '100%',
    height: -500,
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 2,
    borderTopColor: '#FFCAD4',
  },
  iconoSprinklesLogin: {
    width: 40,
    height: 40,
    marginTop: 15,
    marginBottom: 10,
  },
  textoFooterLogin: {
    fontSize: 15,
    color: 'white',
    textAlign: 'center',
    lineHeight: 14,
    width: '90%',
  },
  contenedorRedesLogin: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    marginTop: 10,
  },
  botonRedSocialLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB7C5',
  },
  iconoRedSocialLogin: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  textoRedSocialLogin: {
    fontSize: 12,
    color: '#8E6C88',
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#FFCAD4',
  },
  iconoSprinkles: {
    width: 50,
    height: 50,
    marginBottom: 15,
  },
  textoFooter: {
    fontSize: 15,
    color: 'black',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
  contenedorRedes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  botonRedSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB7C5',
  },
  iconoRedSocial: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  textoRedSocial: {
    fontSize: 12,
    color: '#8E6C88',
    fontWeight: '600',
  },

  // ────── DatePicker ──────
  reactDatePicker: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: '10px',
    display: 'block',
  },
  reactDatePicker__month: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
  },
  reactDatePickerDay: {
    width: '30px',
    height: '30px',
    display: 'inline-block',
    textAlign: 'center',
    lineHeight: '30px',
    borderRadius: '50%',
    margin: '2px',
    fontSize: '14px',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
  },
  reactDatePickerDaySelected: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  reactDatePickerDayHovered: {
    backgroundColor: '#f0f0f0',
  },

  // ────── Gestión de Pedidos ──────
  fondoPasteleria: {
    flex: 1,
    resizeMode: 'cover',
  },
  // fondoPasteleria: {
  //   flex: 1,
  //   resizeMode: 'cover',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCAD4',
  },
  tituloPrincipal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E6C88',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  contenedorFiltros: {
    backgroundColor: 'rgba(253, 225, 255, 0.9)',
    padding: 3,
    borderBottomWidth: 3,
    borderBottomColor: '#FFCAD4',
  },
  contenedorBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 190, 255, 0.8)',
    borderRadius: 18,
    paddingHorizontal: -10,
    marginBottom: -10,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  iconoBuscar: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  inputBusqueda: {
    flex: 1,
    height: 35,
    fontSize: 12,
    color: '#8E6C88',
  },
  filtrosScroll: {
    paddingHorizontal: 5,
  },
  botonFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C7CEEA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#A7B0D1',
  },
  botonFiltroActivo: {
    backgroundColor: '#8E6C88',
    borderColor: '#6D4C5A',
  },
  iconoFiltro: {
    width: 16,
    height: 16,
    marginRight: 5,
    tintColor: '#6D4C5A',
  },
  textoBotonFiltro: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6D4C5A',
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5EAD7',
    padding: 8,
    margin: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8EC5A6',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  botonAccionEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5EAD7',
    padding: 8,
    margin: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8EC5A6',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconoAgregar: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#6D4C5A',
  },
  textoBotonAgregar: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6D4C5A',
  },

  // Estilos nuevos para los botones de acción en cada tarjeta de pedido
  botonAccionEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF476F', // Rojo para indicar eliminación
    padding: 8,
    margin: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D64550',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  botonAccionCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD166', // Amarillo para la acción de cancelar
    padding: 8,
    margin: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0B050',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  botonAccionEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06D6A0', // Verde para editar
    padding: 8,
    margin: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#04B283',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  botonAccionEntregado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#118AB2', // Azul para indicar entregado
    padding: 8,
    margin: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0F7A9B',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconoAccion: {
    width: 20,
    height: 20,
    marginRight: 6,
    tintColor: '#6D4C5A',
  },
  textoAccion: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6D4C5A',
  },
  contenedorPedidos: {
    padding: 8,
    paddingBottom: 12,
  },
  cardPedido: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 5,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  encabezadoPedido: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 4,
  },
  fotoCliente: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  infoCliente: {
    flex: 1,
  },
  nombreCliente: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6D4C5A',
    marginBottom: 4,
  },
  detalleCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconoDetalle: {
    width: 14,
    height: 14,
    marginRight: 4,
    tintColor: '#8E6C88',
  },
  textoDetalle: {
    fontSize: 12,
    color: '#6D4C5A',
  },
  estadoPedido: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  textoEstado: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  contenedorProducto: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
  },
  imagenProducto: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  infoProducto: {
    flex: 1,
    justifyContent: 'center',
  },
  nombreProducto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D4C5A',
    marginBottom: 4,
  },
  contenedorFechas: {
    marginBottom: 8,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconoFecha: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#8E6C88',
  },
  textoFecha: {
    fontSize: 12,
    color: '#6D4C5A',
  },
  contenedorTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  textoTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D4C5A',
    marginRight: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E6C88',
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: 10,
  },

  botonAccionEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5EAD7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8EC5A6',
  },
  botonAccionEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB7C5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9D9A',
  },
  botonTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6D4C5A',
    marginRight: 6,
  },
  iconoAccion: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  textoAccion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6D4C5A',
  },
  sinPedidos: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  iconoSinPedidos: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  textoSinPedidos: {
    fontSize: 16,
    color: '#8E6C88',
    textAlign: 'center',
  },

  // ────── Formularios ──────
  contenedorFormulario: {
    padding: 15,
    paddingBottom: 20,
  },
  cardFormulario: {
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  encabezadoFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconoFormulario: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  tituloFormulario: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E6C88',
  },
  grupoFormulario: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E6C88',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  iconoInput: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#8E6C88',
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#6D4C5A',
  },
  picker: {
    flex: 1,
    height: 50,
    color: '#6D4C5A',
  },
  datePickerWeb: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#6D4C5A',
  },
  datePickerMobile: {
    flex: 1,
  },
  previsualizacionProducto: {
    alignItems: 'center',
    marginVertical: 15,
  },
  botonGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5EAD7',
    padding: 15,
    borderRadius: 15,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#8EC5A6',
  },
  botonCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9AA2',
    padding: 15,
    borderRadius: 15,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E88192',
  },
  textoBotonGuardar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6D4C5A',
    marginRight: 8,
  },
  textoBotonCancelar: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6D4C5A',
    marginRight: 8,
  },
  iconoBoton: {
    width: 20,
    height: 20,
    tintColor: '#6D4C5A',
  },
  botonImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C7CEEA',
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7B0D1',
  },
  textoBotonImagen: {
    fontSize: 14,
    color: '#6D4C5A',
    fontWeight: 'bold',
    marginRight: 8,
  },
  previsualizacionImagen: {
    width: 120,
    height: 120,
    borderRadius: 15,
    alignSelf: 'center',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },

  // ────── Gestión de Inventario ──────
  contenedorMenu: {
    height: 80,
    backgroundColor: 'rgba(253, 225, 255, 0.95)',
    borderBottomWidth: 4,
    borderBottomColor: '#FFCAD4',
    paddingVertical: 10,
  },
  scrollCategorias: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  botonCategoria: {
    minWidth: 100,
    height: 60,
    borderRadius: 15,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconoBotonCategoria: {
    width: 25,
    height: 25,
    marginRight: 5,
    tintColor: '#6D4C5A',
  },
  textoBotonCategoria: {
    color: '#6D4C5A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contenedorProductos: {
    padding: 15,
    paddingBottom: 20,
  },
  encabezadoCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  iconoCategoria: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  tituloCategoria: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8E6C88',
  },
  cardProducto: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    borderRadius: 20,
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  infoProducto: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  categoriaProducto: {
    fontSize: 12,
    color: '#8E6C88',
    fontStyle: 'italic',
    marginTop: 5,
  },
  botonesProducto: {
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  sinProductos: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  iconoSinProductos: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  textoSinProductos: {
    fontSize: 16,
    color: '#8E6C88',
    textAlign: 'center',
  },

  // ────── Gestión de Apartados ──────
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 236, 239, 0.85)',
  },
  contenidoPrincipal: {
    flex: 1,
    marginBottom: 80,
  },
  contenidoScroll: {
    paddingBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E6C88',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    margin: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  tarjetaEstadistica: {
    width: '15%',
    minWidth: 50,
    alignItems: 'center',
    padding: 4,
    borderRadius: 5,
    marginBottom: 3,
  },
  iconoEstadistica: {
    width: 15,
    height: 15,
    marginBottom: 2,
    tintColor: 'white',
  },
  estadisticaNumero: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 1,
  },
  estadisticaTexto: {
    fontSize: 8,
    color: 'white',
    textAlign: 'center',
  },
  listaContainer: {
    padding: 10,
    paddingBottom: 5,
    flexGrow: 1,
  },
  cardApartado: {
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    borderRadius: 20,
    marginBottom: 20,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  estadoContainer: {
    padding: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  clienteContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 15,
  },
  clienteImagen: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  clienteInfo: {
    flex: 1,
  },
  productoContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 15,
  },
  productoImagen: {
    width: 80,
    height: 80,
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  productoInfo: {
    flex: 1,
  },
  fechasContainer: {
    marginBottom: 15,
  },
  fechaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  botonAccionConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B5EAD7',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#8EC5A6',
  },
  botonAccionRecordar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C7CEEA',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#A7B0D1',
  },
  botonAccionEntregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E6C88',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#6D4C5A',
  },
  botonAccionEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFDAC1',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E8B9A7',
  },
  botonAccionCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9AA2',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E88192',
  },
  botonAccionEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8B',
    padding: 10,
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E84A6F',
  },
  listaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  iconoListaVacia: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  textoListaVacia: {
    fontSize: 16,
    color: '#8E6C88',
    textAlign: 'center',
  },
  // ────── Análisis y Reportes ──────
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,236,239,0.85)',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconoTitulo: {
    width: 30,
    height: 30,
    marginRight: 10,
    tintColor: '#8E6C88',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8E6C88',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tarjetaResumen: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  textoResumen: {
    fontSize: 16,
    color: '#8E6C88',
    marginBottom: 5,
  },
  gananciaTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8E6C88',
  },
  iconoGanancias: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 15,
    top: 15,
    opacity: 0.3,
    tintColor: '#8E6C88',
  },
  cargandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  textoCargando: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E6C88',
  },
  listaContainer: {
    paddingHorizontal: 15,
  },
  cardReporte: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  encabezadoReporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 10,
  },
  totalReporte: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E6C88',
  },
  fechaReporte: {
    fontSize: 14,
    color: '#8E6C88',
  },
  detalleReporte: {
    marginTop: 10,
  },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconoDetalle: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#8E6C88',
  },
  textoDetalle: {
    fontSize: 16,
    color: '#8E6C88',
  },
  listaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(255,236,239,0.9)',
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  iconoListaVacia: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  textoListaVacia: {
    fontSize: 16,
    color: '#8E6C88',
    textAlign: 'center',
  },
  // ────── Atención al Cliente ──────
  scrollContainer: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 236, 239, 0.85)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFCAD4',
  },
  contenedorBuscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 236, 239, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFCAD4',
  },
  cardPastel: {
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  encabezadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB7C5',
    paddingBottom: 10,
  },
  iconoCliente: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  contenedorMensaje: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  iconoMensaje: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginTop: 3,
  },
  contenedorRespuesta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  iconoRespuesta: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginTop: 3,
  },
  textoRespuesta: {
    flex: 1,
    fontSize: 16,
    color: '#5E8C6A',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  botonResponder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9AA2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  textoBoton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  textoBotonEliminar: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  iconoEliminar: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  contenedorFormularioRespuesta: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#FFB7C5',
  },
  inputRespuesta: {
    borderWidth: 1,
    borderColor: '#D1A7B8',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
    minHeight: 100,
    color: '#6D4C5A',
    textAlignVertical: 'top',
  },
  botonEnviar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E6C88',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 15,
    flex: 1,
    marginRight: 10,
  },
  textoBotonEnviar: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  botonContacto: {
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFB7C5',
    shadowColor: '#8E6C88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  contenedorContacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconoContacto: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  textoContacto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E6C88',
    textAlign: 'center',
  },
  contenedorPreguntas: {
    backgroundColor: 'rgba(255, 236, 239, 0.95)',
    padding: 20,
    borderRadius: 20,
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#FFB7C5',
  },
  encabezadoPreguntas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconoPreguntas: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  cardPregunta: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D1A7B8',
  },
  contenedorPregunta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconoInterrogacion: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginTop: 3,
  },
  contenedorRespuestaPregunta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  iconoCheck: {
    width: 25,
    height: 25,
    marginRight: 10,
    marginTop: 3,
  },
  botonEliminarPregunta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: 'center',
  },
  textoBotonEliminarPregunta: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  iconoEliminarPregunta: {
    width: 16,
    height: 16,
    tintColor: 'white',
  },

  // ────── Estilos de Usuario ──────
  fondoUsuario: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoUsuario: {
    width: 110,
    height: 90,
    bottom: 30,
    borderRadius: 100,
  },
  cuadrologinUsuario: {
    bottom: 3,
    width: 280,
    height: 400,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
  },
  bordesUsuario: {
    width: '100%',
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
  },
  textoUsuario: {
    padding: 10,
  },
  tituloUsuario: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'purple',
    marginBottom: 20,
    bottom: -110,
  },
  loginUsuario: {
    padding: 10,
  },
  iniciarUsuario: {
    backgroundColor: '#ffbd42',
    paddingVertical: 7,
    paddingHorizontal: 40,
    borderRadius: 35,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciarTextoUsuario: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  azullUsuario: {
    marginTop: 50,
    marginLeft: 10,
    color: '#1d8eff',
    bottom: 30,
    right: -60,
  },
  azulllUsuario: {
    color: '#1d8eff',
    bottom: 47,
    left: -90,
  },
  botonAtencionCliente: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  imagenTelefono: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  textoAtencionCliente: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  imagenProducto: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 10,
    resizeMode: 'contain',
  },
});
