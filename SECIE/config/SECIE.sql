create database SECIE_DB;
use SECIE_DB;
create table PerfilesUsuario(
IDPerfil varchar(5) primary key,
NombrePerfil varchar(50)
);
insert into PerfilesUsuario values ('AM','ADMINISTRADOR-MONDAINAI'), ('C','CLIENTE'), ('E','ESPECIALISTA'), ('A','AUDITOR'), ('D','DESPACHO');
select * from PerfilesUsuario;

create table Usuario(
RFCUsuario varchar(15) primary key,
IDPerfil varchar(5), 
foreign key (IDPerfil) references PerfilesUsuario(IDPerfil),
CorreoUsuario varchar(255),
Nombre varchar(255),
Contraseña varchar(255)
);

select * from Usuario;

CREATE TABLE NuevoProyecto (
    IDProyecto INT AUTO_INCREMENT PRIMARY KEY,
    TipoDeProyecto VARCHAR(255),
    BreveDescripcion VARCHAR(511)
);

CREATE TABLE ClienteProyecto (
    IDProyecto INT,
    RFCCliente VARCHAR(15),
    PRIMARY KEY (IDProyecto, RFCCliente),
    FOREIGN KEY (IDProyecto) REFERENCES NuevoProyecto(IDProyecto),
    FOREIGN KEY (RFCCliente) REFERENCES Usuario(RFCUsuario)
);

CREATE TABLE ResponsableProyecto (
    IDProyecto INT,
    RFCResponsable VARCHAR(15),
    PRIMARY KEY (IDProyecto, RFCResponsable),
    FOREIGN KEY (IDProyecto) REFERENCES NuevoProyecto(IDProyecto),
    FOREIGN KEY (RFCResponsable) REFERENCES Usuario(RFCUsuario)
);

CREATE TABLE AuditorProyecto (
    IDProyecto INT,
    RFCAuditor VARCHAR(15),
    PRIMARY KEY (IDProyecto, RFCAuditor),
    FOREIGN KEY (IDProyecto) REFERENCES NuevoProyecto(IDProyecto),
    FOREIGN KEY (RFCAuditor) REFERENCES Usuario(RFCUsuario)
);

select * from NuevoProyecto;
Select * from ClienteProyecto;
Select * from ResponsableProyecto;
Select * from AuditorProyecto;

create table InformacionDelElemento( 
IDProyecto int,
foreign key (IDProyecto) references NuevoProyecto(IDProyecto),
IDSubproyecto int,
IDHito int,
IDActividad int, 
IDAccion int,
PRIMARY KEY (IDProyecto, IDSubproyecto, IDHito, IDActividad, IDAccion),
TipoDeElemento varchar(255),
Relacion varchar(255), 
ConceptoPrincipal varchar(255), 
Descripcion varchar(511),
Importancia varchar(1000), 
Metas varchar(1000), 
Objetivos varchar(1000), 
Kpis varchar(255),
Herramientas varchar(1000), 
Dependencia varchar(255), 
Pasos varchar(1000),
Prioridad varchar(255),
ResultadoEsperado varchar(255), 
Validacion varchar(255),
Responsable varchar(255), 
AreaResponsable varchar(255)
);
-- select IDProyecto, IDSubproyecto, IDHito, IDActividad, IDAccion, TipoDeElemento from InformacionDelElemento;
select * from InformacionDelElemento;

create table CronogramaYAvance(
IDElemento int, 
foreign key (IDElemento) references InformacionDelElemento(IDElemento), 
AvancesNotas varchar(511),
SoporteDocumental varchar(255),
RutaSoporteDocumental varchar(255), 
FeedbackCliente varchar(511),
DocumentoDelCliente varchar(255),
RutaDocumentoDelCliente varchar(255)
);

create table DocumentacionYRetroalimentacion(
IDElemento int, 
foreign key (IDElemento) references InformacionDelElemento(IDElemento), 
Estatus varchar(255),
ParticipacionActividad varchar(255), 
Progreso varchar(255), 
FInicio date, 
FTermino date,
FLimite date, 
DiasAdicionales varchar(255), 
TInicio varchar(255), 
TFinal varchar(255),
TLimite varchar(255)
);

create table Otros(
IDElemento int, 
foreign key (IDElemento) references InformacionDelElemento(IDElemento),
CostosAsociados decimal(15,2),
Justificacion varchar(255),
Validacion varchar(255),
RecursosNecesarios varchar(255)
);