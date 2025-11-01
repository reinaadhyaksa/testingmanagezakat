import Footer from "./interface/Footer";
import Header from "./interface/Header";
import Hero from "./interface/Hero";
import Kegiatan from "./interface/Kegiatan";
import Transparansi from "./interface/Transparansi";
import VisiMisi from "./interface/VisiMisi";

const Beranda = () => {
    

    return (
        <>
            <Header />
            <Hero />
            <VisiMisi />
            <Kegiatan />
            <Transparansi />
            <Footer />
        </>
    );
};

export default Beranda;