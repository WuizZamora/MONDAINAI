CREATE DATABASE SERE_DB;
USE SERE_DB;

create table PerfilesUsuarios(
IDPerfil varchar(255) primary key,
TipoPerfil varchar(255)
);
--
create table PreregistroDespachoEmpresa(
Nombre varchar(255),
RFC varchar(255) primary key
);
--
create table DespachoEmpresa(
RFC varchar(255),
foreign key (RFC) references PreregistroDespachoEmpresa(RFC),
NombreEntregaFactura varchar(255), 
CorreoEntregaFactura varchar(255), 
UsoCFDI varchar(255),
ClaveSAT varchar(255),
CSF varchar(255)
);
-- TABLA USUARIOS--
create table Usuarios(
RFC varchar(255) primary key,
Correo varchar(255),
Nombre varchar(255),
Contraseña varchar(255), 
RFCAsociado varchar(255),
foreign key (RFCAsociado) references PreregistroDespachoEmpresa(RFC),
IDPerfil varchar(255), 
foreign key (IDPerfil) references PerfilesUsuarios(IDPerfil)
);
-- TABLA INFORMACION GENERAL DE LA CUENTA --
CREATE TABLE Cliente_InfGeneralCuenta (
	IDCuenta INT AUTO_INCREMENT PRIMARY KEY,
    NoClientePadre varchar(255),
    NoClienteHijo varchar(255),
    TipoDeCaso varchar(255),
    FechaDeAsignacion date,
    RFCUsuario varchar(255),
    FOREIGN KEY (RFCUsuario) REFERENCES Usuarios(RFC),
    RFCDespacho varchar(255), 
    foreign key (RFCDespacho) references DespachoEmpresa(RFC)
);
--
CREATE TABLE Cliente_InfDeudor (
    IDCuenta INT,
    FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
    RegimenDeudor VARCHAR(255),
    DireccionComercial VARCHAR(255),
    PoderNotarial VARCHAR(255),
	PoderNotarialDetalle VARCHAR(255),
    DomicilioFiscal VARCHAR(255),
    DomicilioPersonal VARCHAR(255),
    DomicilioLaboral VARCHAR(255),
    RazonSocial VARCHAR(255),
    Rfc VARCHAR(255),
    Curp VARCHAR(255),
    DomicilioEntrega VARCHAR(255),
    DomicilioAlternativo VARCHAR(255),
    ViaPrincipalDeContacto VARCHAR(255),
    DomicilioConfirmado VARCHAR(255),
    FechaValidacion DATE,
    NumeroCelular VARCHAR(50),
    TelefonoFijoUno VARCHAR(50),
    TelefonoFijoDos VARCHAR(50),
    Correo VARCHAR(255)
);
--
CREATE TABLE Cliente_Contactos (
    IDCuenta INT NOT NULL,
    NumeroContacto INT NOT NULL,
    NombreContacto VARCHAR(255),
    DireccionContacto VARCHAR(255),
    TelefonoContacto VARCHAR(50),
    CelularContacto VARCHAR(50),
    PuestoContacto VARCHAR(255),
    EmailContacto VARCHAR(255),
    EmailContactoAdicional VARCHAR(255),
    ObservacionesContacto VARCHAR(511),
    PRIMARY KEY (IDCuenta, NumeroContacto),
    FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta)
);
--
create table Cliente_VariablesDeRiesgo(
	IDCuenta INT NOT NULL,
    FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
    TipoDeuda varchar(255),
    TipoGarantia varchar(255),
    OtroTipoGarantia varchar (255),
    DocumentacionLegal varchar (255),
    RutaDocumentacionLegal varchar(255),
    DescripcionDañosReclamados varchar (511),
    DocumentacionDañosReclamados varchar (255), 
    RutaDocumentacionDañosReclamados varchar(255),
    DescripcionActitudDeudor varchar (511),
    DocumentacionSoporteActitudDeudor varchar (255),
    RutaDocumentacionSoporteActitudDeudor varchar(255),
    BuroDelCliente varchar (255),
    RutaBuroDelCliente varchar(255),
    Banco varchar (255), 
    NumeroDeCuenta varchar (255), 
    EstadoDeCuenta varchar (255), 
    EstadoDeCuentaFile varchar (255), 
    RutaEstadoDeCuentaFile varchar(255)
);
--
create table Cliente_MontoDeDeuda(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
IDMonto int, 
PRIMARY KEY (IDCuenta, IDMonto),
DescripcionAdeudo varchar(255),
AdeudoMonto decimal(15,2)
);
--
create table Cliente_EstadoDeCuenta(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
IDEstadoDeCuenta int, 
primary key (IDCuenta, IDEstadoDeCuenta),
TipoDocumento varchar (255),
NoDeDocumento varchar(255),
FechaSoporte date, 
FechSoporteVencimiento date,
ImporteTotal decimal(15,2),
ImporteRestante decimal (15,2),
PromedioPonderado decimal (15,2),
ArchivosSoporte varchar (255),
RutaArchivosSoporte varchar(255)
);
--
create table Cliente_HistorialDePagos(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
IDHistorialDePago int,
primary key (IDCuenta, IDHistorialDePago),
FechaTransaccion date,
NumeroFacturaORecibo varchar(255),
MontoPagado decimal(15,2),
EstadoDelPago varchar(255),
ObservacionesPago varchar(511)
);
--
create table Cliente_DescripcionDelCaso(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
HistorialDelCaso varchar(1023),
AccionesTomadas varchar(1023), 
CircuntanciasEspecificas varchar(1023)
);
--
create table Cliente_DocumentacionExtra(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
IDDocumentacion int,
primary key (IDCuenta, IDDocumentacion),
DescripcionArchivoExtra varchar(255),
ArchivoExtra varchar(255),
RutaArchivoExtra varchar(255),
ModoEntregaArchivoExtra varchar(255)
);
--
create table Cliente_AsignacionDeCaso(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
AbogadoResponsable varchar(255),
FOREIGN KEY (AbogadoResponsable) REFERENCES Usuarios(RFC),
AbogadoAsistente varchar(255),
FOREIGN KEY (AbogadoAsistente) REFERENCES Usuarios(RFC),
EstadoDeCuenta varchar(255), 
FechaDeCierre date
);
--
create table Cliente_Cotizacion(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
TipoDeCaso varchar(255),
Comentarios varchar(1023),
Cotizacion varchar(255), 
FechaCotizacion date, 
Validacion BIT
);
--
create table Despacho_CostosHonorarios(
 IDCostosHonorarios INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, 
 FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255),
 FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 TipoDeCosto varchar(255),
 Cantidad decimal(15,2),
 Descripcion varchar(1023),
 FechaCostoHonorario datetime,
 Soporte varchar(255),
 Validacion BOOLEAN DEFAULT FALSE,
 RFCUsuario varchar (255),
 FOREIGN KEY (RFCUsuario) REFERENCES Usuarios(RFC),
 FechaValidacion datetime
);
--
create table Despacho_ImporteRecuperado(
 IDImporteRecuperado INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 ImporteRecuperado decimal(15,2),
 ImporteRestante decimal(15,2),
 Observaciones varchar(1023),
 FechaImporteRecuperado datetime,
 Soporte varchar(255),
 Validacion BOOLEAN DEFAULT FALSE,
 RFCUsuario varchar (255), FOREIGN KEY (RFCUsuario) REFERENCES Usuarios(RFC),
 FechaValidacion datetime
);
--
create table Despacho_PlazosFechasLimite(
 IDPlazoFecha INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 FechaPlazoFecha date,
 Descripcion varchar(1023), 
 FechaRegistroPlazo datetime
);
--
create table Despacho_Garantia(
 IDGarantia INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 TipoGarantia varchar(255),
 DocumentoSoporte varchar (255),
 FechaRegistro datetime,
 RetroAlimentacion varchar(1023)
);
--
create table Despacho_ProcesoJudicial(
 IDProcesoJudicial INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 Expediente varchar(255),
 Juzgado varchar (255),
 Jurisdiccion varchar (255),
 FechaRegistro datetime, 
 EstadoDelCaso varchar(255)
);
