show databases;

CREATE DATABASE SERE_DB;
USE SERE_DB;

-- TABLA USUARIOS--
create table Usuarios(
IDUsuario int auto_increment primary key,
CorreoUsuario varchar(255),
Usuario varchar(50),
Contraseña varchar(255), 
TipoUsuario varchar (255)
);

select * from Usuarios;

-- TABLA INFORMACION GENERAL DE LA CUENTA --
CREATE TABLE InfGeneralCuenta (
	IDCuenta INT AUTO_INCREMENT PRIMARY KEY,
    NoClientePadre varchar(255),
    NoClienteHijo varchar(255),
    TipoDeCaso varchar(255),
    FechaDeAsignacion date,
    IDUsuario int,
    FOREIGN KEY (IDUsuario) REFERENCES Usuarios(IDUsuario)
);

CREATE TABLE InfDeudor (
    IDCuenta INT,
    FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
    RegimenDeudor VARCHAR(255),
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
    Email VARCHAR(255),
	DomicilioPersonalPF VARCHAR(255),
	DomicilioLaboralPF VARCHAR(255),
	DomicilioFiscalPFAE VARCHAR(255),
	DomicilioPersonalPFAE VARCHAR(255),
	DomicilioLaboralPFAE VARCHAR(255),
	RazonSocial VARCHAR(255),
	DireccionComercial VARCHAR(255),
	PoderNotarial VARCHAR(255),
	PoderNotarialDetalle VARCHAR(255),
	DomicilioFiscalPM VARCHAR(255)
);
select * from InfDeudor;
CREATE TABLE Contactos (
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
    FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta)
);

create table VariablesDeRiesgo(
	IDCuenta INT NOT NULL,
    FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
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

create table MontoDeDeuda(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
IDMonto int, 
PRIMARY KEY (IDCuenta, IDMonto),
DescripcionAdeudo varchar(255),
AdeudoMonto decimal(15,2)
);

create table EstadoDeCuenta(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
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

create table HistorialDePagos(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
IDHistorialDePago int,
primary key (IDCuenta, IDHistorialDePago),
FechaTransaccion date,
NumeroFacturaORecibo varchar(255),
MontoPagado decimal(15,2),
EstadoDelPago varchar(255),
ObservacionesPago varchar(511)
);

create table DescripcionDelCaso(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
HistorialDelCaso varchar(1023),
AccionesTomadas varchar(1023), 
CircuntanciasEspecificas varchar(1023)
);

create table DocumentacionExtra(
IDCuenta int, 
FOREIGN KEY (IDCuenta) REFERENCES InfGeneralCuenta(IDCuenta),
IDDocumentacion int,
primary key (IDCuenta, IDDocumentacion),
DescripcionArchivoExtra varchar(255),
ArchivoExtra varchar(255),
RutaArchivoExtra varchar(255),
ModoEntregaArchivoExtra varchar(255)
);

-- C O N S U L T A S --
SELECT InfGeneralCuenta.IDCuenta,
       InfDeudor.Rfc, 
       InfGeneralCuenta.NoClientePadre, 
       InfGeneralCuenta.NoClienteHijo, 
	   InfDeudor.RazonSocial,
       InfDeudor.DomicilioFiscalPFAE
FROM InfGeneralCuenta
JOIN InfDeudor ON InfGeneralCuenta.IDCuenta = InfDeudor.IDCuenta;
-- WHERE InfGeneralCuenta.IDCuenta = '1';


SELECT  InfGeneralCuenta.IDCuenta,
		InfDeudor.DomicilioPersonalPF,
       InfDeudor.DomicilioLaboralPF,
       InfDeudor.DomicilioPersonalPFAE,
       InfDeudor.DomicilioLaboralPFAE,
       InfDeudor.DomicilioEntrega,
       InfDeudor.DomicilioAlternativo
FROM InfGeneralCuenta
JOIN InfDeudor ON InfGeneralCuenta.IDCuenta = InfDeudor.IDCuenta;
-- WHERE InfGeneralCuenta.IDCuenta = '1';

SELECT V.IDCuenta,
       V.RutaDocumentacionLegal,
       V.RutaDocumentacionDañosReclamados,
       V.RutaDocumentacionSoporteActitudDeudor,
       V.RutaBuroDelCliente,
       V.RutaEstadoDeCuentaFile,
       DE.RutaArchivoExtra
FROM VariablesDeRiesgo V
LEFT JOIN DocumentacionExtra DE ON V.IDCuenta = DE.IDCuenta;
-- WHERE V.IDCuenta = '4'



