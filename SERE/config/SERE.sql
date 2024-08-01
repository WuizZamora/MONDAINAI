CREATE DATABASE SERE_DB;
USE SERE_DB;

create table PerfilesUsuarios(
IDPerfil varchar(255) primary key,
TipoPerfil varchar(255)
);
select * from PerfilesUsuarios;
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
SELECT * FROM DespachoEmpresa;
-- TABLA USUARIOS--
create table Usuarios(
RFC varchar(255) primary key,
Correo varchar(255),
Nombre varchar(255),
Contraseña varchar(255), 
RFCAsociado varchar(255),
foreign key (RFCAsociado) references PreregistroDespachoEmpresa(RFC),
IDPerfil varchar(255), 
foreign key (IDPerfil) references PerfilesUsuarios(IDPerfil),
Usuario_Activo boolean default true
);

select * from Usuarios;
select IDPerfil from Usuarios where RFC = 'ZAPL0108266K7';
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
    foreign key (RFCDespacho) references DespachoEmpresa(RFC),
    Usuario_Activo boolean default true,
    RFCAsociado varchar(255), foreign key (RFCAsociado) REFERENCES Usuarios (RFCAsociado)
);

select * from Usuarios;
select * from Cliente_InfGeneralCuenta; 
-- where RFCUsuario ='XAXX010101006';
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
SELECT IDCuenta, TipoGarantia from Cliente_VariablesDeRiesgo;
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
select * from Cliente_EstadoDeCuenta;
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
select * from Cliente_DescripcionDelCaso;
select * from Cliente_DocumentacionExtra;
delete from Cliente_DescripcionDelCaso where IDCuenta='39';
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
CREATE TABLE Despacho_AsignacionDeCaso (
	IDAsignacionDeCaso int auto_increment primary key,
    IDCuenta int, 
    FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
    AbogadoResponsable varchar(255),
    AbogadoResponsableID varchar(255) DEFAULT 'D2', -- ID para Abogado Responsable
    FOREIGN KEY (AbogadoResponsable) REFERENCES Usuarios(RFC),
    FOREIGN KEY (AbogadoResponsableID) REFERENCES PerfilesUsuarios(IDPerfil),
    AbogadoAsistente varchar(255),
    AbogadoAsistenteID varchar(255) DEFAULT 'D1', -- ID para Abogado Asistente
    FOREIGN KEY (AbogadoAsistente) REFERENCES Usuarios(RFC),
    FOREIGN KEY (AbogadoAsistenteID) REFERENCES PerfilesUsuarios(IDPerfil),
    EstadoDeCuenta varchar(255), 
    FechaDeCierre date
);
select * from Despacho_AsignacionDeCaso;
    
 SELECT IDCuenta, MAX(IDAsignacionDeCaso) AS UltimoIDAsignacionDeCaso
    FROM Despacho_AsignacionDeCaso
    WHERE (AbogadoResponsable = 'ZAPL0108266K6' OR AbogadoAsistente = 'ZAPL0108266K6')
    GROUP BY IDCuenta;

WITH UltimosCasos AS (
    SELECT IDCuenta, MAX(IDAsignacionDeCaso) AS UltimoIDAsignacionDeCaso
    FROM Despacho_AsignacionDeCaso
    GROUP BY IDCuenta
),
CasosConRFC AS (
    SELECT a.IDCuenta, a.IDAsignacionDeCaso
    FROM Despacho_AsignacionDeCaso a
    JOIN UltimosCasos u ON a.IDCuenta = u.IDCuenta AND a.IDAsignacionDeCaso = u.UltimoIDAsignacionDeCaso
    WHERE a.AbogadoResponsable = 'ZAPL0108266K6' OR a.AbogadoAsistente = 'ZAPL0108266K6'
)
SELECT IDCuenta
FROM UltimosCasos
WHERE IDCuenta IN (SELECT IDCuenta FROM CasosConRFC);

-- AVER
-- Consulta para obtener los IDCuenta de los casos donde al menos uno de los RFC es relevante
WITH UltimosCasos AS (
    SELECT IDCuenta, MAX(IDAsignacionDeCaso) AS UltimoIDAsignacionDeCaso
    FROM Despacho_AsignacionDeCaso
    GROUP BY IDCuenta
),
CasosConRFC AS (
    SELECT a.IDCuenta, a.IDAsignacionDeCaso
    FROM Despacho_AsignacionDeCaso a
    JOIN UltimosCasos u ON a.IDCuenta = u.IDCuenta AND a.IDAsignacionDeCaso = u.UltimoIDAsignacionDeCaso
    WHERE a.AbogadoResponsable = 'ZAPL0108266K7' OR a.AbogadoAsistente = 'ZAPL0108266K7'
)

-- Consulta principal para obtener los detalles asociados a los IDCuenta relevantes
SELECT d.IDCuenta
FROM Despacho_AsignacionDeCaso d
JOIN CasosConRFC c ON d.IDCuenta = c.IDCuenta AND d.IDAsignacionDeCaso = c.IDAsignacionDeCaso
WHERE d.IDCuenta IN (
    SELECT IDCuenta
    FROM CasosConRFC
);

--
create table Despacho_Cotizacion(
IDCotizacion INT AUTO_INCREMENT PRIMARY KEY,
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
RFCDespacho varchar(255),
FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
TipoDeCaso varchar(255),
Comentarios varchar(1023),
Cotizacion varchar(255), 
FechaCotizacion date, 
Validacion BOOLEAN DEFAULT FALSE,
RFCUsuario varchar (255),
FOREIGN KEY (RFCUsuario) REFERENCES Usuarios(RFC),
FechaValidacion datetime
);

SELECT * FROM Despacho_Cotizacion;
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
select * from Despacho_ImporteRecuperado;
--
create table Despacho_PlazosFechasLimite(
 IDPlazoFecha INT AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 FechaPlazoFecha date,
 Descripcion varchar(1023), 
 FechaRegistroPlazo datetime
);
select * from Despacho_PlazosFechasLimite;
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
-- NUEVAS TABLAS--
create table Despacho_GestionCaso(
 IDGestionCaso int AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 FechaProximaAccion date,
 ProximasAcciones varchar(255),
 SoporteActuaciones varchar(255),
 FechaRegistro datetime, 
 IDProcesoJudicial int, FOREIGN KEY (IDProcesoJudicial) REFERENCES Despacho_ProcesoJudicial(IDProcesoJudicial)
);
select * from Despacho_DocumentosProcesales;

create table Despacho_DocumentosProcesales(
 IDDocumentoProcesal int AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 DocumentosProcesales varchar(255),
 FechaRegistro datetime, 
 IDProcesoJudicial int, FOREIGN KEY (IDProcesoJudicial) REFERENCES Despacho_ProcesoJudicial(IDProcesoJudicial)
);
create table Cliente_Retroalimentacion(
 IDRetroalimentacion int AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 Retroalimentacion varchar(1023),
 FechaRegistro datetime
);

select * from Cliente_RetroalimentacionAccion;

create table Cliente_RetroalimentacionAccion(
 IDRetroalimentacionAccion int AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 IDGestion int,FOREIGN KEY (IDGestion) REFERENCES Despacho_GestionCaso(IDGestionCaso),
 Retroalimentacion varchar(1023),
 FechaRegistro datetime
);
SELECT * FROM Pagares;
	CREATE TABLE Pagares (
		ID INT AUTO_INCREMENT PRIMARY KEY,
		IDCuenta INT,
		RFCDespacho VARCHAR(255),
		FechaPrescripcion DATE,
		Importe DECIMAL(10, 2),
		FechaSuscripcion DATE,
		FechaVencimiento DATE,
		Monto DECIMAL(10, 2),
		Interes DECIMAL(5, 2),
		fechaHoraPagare DATETIME,
		FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
		FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC)
	);

	CREATE TABLE Suscriptores (
		ID INT AUTO_INCREMENT PRIMARY KEY,
		PagarID INT,
		NombreSuscriptor VARCHAR(100),
		DomicilioSuscriptor VARCHAR(200),
		FOREIGN KEY (PagarID) REFERENCES Pagares(ID)
	);

	CREATE TABLE Avales (
		ID INT AUTO_INCREMENT PRIMARY KEY,
		PagarID INT,
		NombreAval VARCHAR(100),
		DireccionAval VARCHAR(200),
		FOREIGN KEY (PagarID) REFERENCES Pagares(ID)
	);

create table Despacho_Incobrabilidad(
 IDIncobrabilidad int AUTO_INCREMENT PRIMARY KEY,
 IDCuenta int, FOREIGN KEY (IDCuenta) REFERENCES Cliente_InfGeneralCuenta(IDCuenta),
 RFCDespacho varchar(255), FOREIGN KEY (RFCDespacho) REFERENCES Usuarios(RFC),
 FormatoIncobrabilidad varchar(255),
 Comentarios varchar(1023),
 FechaRegistro datetime
);

select * from Despacho_Incobrabilidad;



