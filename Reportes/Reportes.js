document.addEventListener('DOMContentLoaded', () => {

    cargarTendenciaMensual();
    cargarMasVendidos();
    cargarHistorialVentas();
    cargarRendimientoProductos();

    document.getElementById('filtro-fecha-inicio').addEventListener('change', cargarHistorialVentas);
    document.getElementById('filtro-fecha-fin').addEventListener('change', cargarHistorialVentas);
    document.getElementById('filtro-tipo-producto').addEventListener('change', cargarHistorialVentas);
    
    cargarFiltroCategorias();
});


//  Carga los datos de la tarjeta "Tendencia Mensual de Ventas"
 
async function cargarTendenciaMensual() {
    try {
        // RUTA CORREGIDA
        const response = await fetch('../Gestión de Productos/api_productos.php?accion=reporte_tendencia_mensual');
        const { success, data, error } = await response.json();

        if (success) {
            // Actualiza el HTML con los datos recibidos
            document.getElementById('tendencia-total').textContent = data.totalFormateado;
            document.getElementById('tendencia-aumento').textContent = data.porcentajeFormateado;
            
            
            // 1. Preparamos los datos para el gráfico
            const meses = data.datosGrafico.map(d => `${d.anio}-${d.mes.toString().padStart(2, '0')}`);
            const totales = data.datosGrafico.map(d => d.total);
            
            // 2. Opciones del gráfico de línea
            const optionsTendencia = {
                chart: {
                    type: 'area',
                    height: 180,
                    toolbar: { show: false },
                    zoom: { enabled: false },
                    sparkline: { 
                      enabled: true
                    }
                },
                series: [{
                    name: 'Ventas',
                    data: totales
                }],
                xaxis: {
                    categories: meses, 
                    labels: { show: false },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { show: false }
                },
                grid: {
                    show: false 
                },
                stroke: {
                    curve: 'smooth', 
                    width: 3
                },
                dataLabels: {
                    enabled: false 
                },
                fill: { 
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.1,
                        stops: [0, 100]
                    }
                },
                tooltip: {
                    x: {
                        format: 'MMM yyyy'
                    },
                    y: {
                        formatter: function (val) {
                            return "$" + val
                        }
                    }
                }
            };
            
            // 3. Renderizar el gráfico
            const chartTendencia = new ApexCharts(document.getElementById('chart-tendencia-mensual'), optionsTendencia);
            chartTendencia.render();
            

        } else {
            console.error('Error al cargar tendencia:', error);
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}

//  Carga los datos de la tarjeta "Productos Más Vendidos"
async function cargarMasVendidos() {
    try {
        // RUTA CORREGIDA
        const response = await fetch('../Gestión de Productos/api_productos.php?accion=reporte_mas_vendidos');
        const { success, data, error } = await response.json();

        if (success) {
            document.getElementById('mas-vendidos-total').textContent = data.totalFormateado;
            document.getElementById('mas-vendidos-aumento').textContent = data.porcentajeFormateado;
            

            // 1. Preparamos los datos
            const productos = data.datosGrafico.map(d => d.Nombre);
            const unidades = data.datosGrafico.map(d => d.unidades);
            
            // 2. Opciones del gráfico de barras
            const optionsMasVendidos = {
                chart: {
                    type: 'bar',
                    height: 180,
                    toolbar: { show: false },
                    zoom: { enabled: false }
                },
                series: [{
                    name: 'Unidades',
                    data: unidades
                }],
                xaxis: {
                    categories: productos, 
                    labels: { show: true, style: { fontSize: '10px' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: { show: false }
                },
                grid: {
                    show: false
                },
                plotOptions: {
                    bar: {
                        columnWidth: '50%', 
                        borderRadius: 4 
                    }
                },
                legend: {
                    show: false // Oculta la leyenda
                },
                dataLabels: {
                    enabled: false
                }
            };
            
            // 3. Renderizar el gráfico
            const chartMasVendidos = new ApexCharts(document.getElementById('chart-mas-vendidos'), optionsMasVendidos);
            chartMasVendidos.render();

            // --- FIN CÓDIGO DEL GRÁFICO ---

        } else {
            console.error('Error al cargar más vendidos:', error);
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}

//  Carga los datos de la tabla "Historial de Ventas"
async function cargarHistorialVentas() {
    try {
        // 1. Obtener valores de los filtros
        const fechaInicio = document.getElementById('filtro-fecha-inicio').value;
        const fechaFin = document.getElementById('filtro-fecha-fin').value;
        const idCategoria = document.getElementById('filtro-tipo-producto').value; // El <select>

        // 2. Construir la URL con los parámetros
        const url = `../Gestión de Productos/api_productos.php?accion=reporte_historial_ventas&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&id_categoria=${idCategoria}`;
        
        // 3. Llamar a la API
        const response = await fetch(url);
        const { success, data, error } = await response.json();

        if (success) {
            const tbody = document.getElementById('tabla-historial-body');
            tbody.innerHTML = ''; // Limpiar la tabla antes de llenar

            // 4. Crear una fila <tr> por cada registro
            data.forEach(venta => {
                const tr = document.createElement('tr');
                tr.classList.add('border-t', 'border-t-[#dbe0e6]');
                
                // Usamos innerHTML para construir las celdas <td>
                tr.innerHTML = `
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${venta.Fecha}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">${venta.Producto}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${venta.CantidadVendida}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${venta.Ingresos}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${venta.Descuento}</td>
                `;
                tbody.appendChild(tr); 
            });
        } else {
            console.error('Error al cargar historial:', error);
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}

//  Carga los datos de la tabla "Rendimiento del Producto"
async function cargarRendimientoProductos() {
    try {
        // RUTA CORREGIDA
        const response = await fetch('../Gestión de Productos/api_productos.php?accion=reporte_rendimiento_producto');
        const { success, data, error } = await response.json();

        if (success) {
            const tbody = document.getElementById('tabla-rendimiento-body');
            tbody.innerHTML = ''; // Limpiar

            data.forEach(prod => {
                const tr = document.createElement('tr');
                tr.classList.add('border-t', 'border-t-[#dbe0e6]');
                tr.innerHTML = `
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#111418] text-sm font-normal leading-normal">${prod.Producto}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${prod.VentasTotales}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${prod.UnidadesVendidas}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${prod.PrecioPromedio}</td>
                    <td class="h-[72px] px-4 py-2 w-[400px] text-[#617589] text-sm font-normal leading-normal">${prod.NivelStock}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            console.error('Error al cargar rendimiento:', error);
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}

//  Carga las categorías en el <select> del filtro "Tipo de Producto"
async function cargarFiltroCategorias() {
    try {
       
        const response = await fetch('../Gestión de Productos/api_productos.php?accion=listar_categorias');
        const { success, data, error } = await response.json();
        
        if (success) {
            const select = document.getElementById('filtro-tipo-producto');
            // Limpiamos las opciones que vienen en el HTML (menos la primera)
            select.innerHTML = '<option value="0">Todos los Tipos de Producto</option>';
            
            data.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id_Categoria;
                option.textContent = categoria.Nombre;
                select.appendChild(option);
            });
        } else {
            console.error('Error al cargar categorías:', error);
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    }
}