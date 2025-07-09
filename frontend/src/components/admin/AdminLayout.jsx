import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout = () => {
    const activeLink = 'bg-cyan-600 text-white';
    const inactiveLink = 'bg-slate-700 hover:bg-slate-600';

    return (
        <div className="w-full max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-cyan-400 text-center mb-8">Panel de Administración</h1>
            <nav className="flex justify-center gap-4 mb-8">
                <NavLink to="/admin/questions" className={({ isActive }) => `${isActive ? activeLink : inactiveLink} font-bold py-2 px-4 rounded-md transition`}>
                    Gestionar Preguntas
                </NavLink>
                <NavLink to="/admin/scores" className={({ isActive }) => `${isActive ? activeLink : inactiveLink} font-bold py-2 px-4 rounded-md transition`}>
                    Gestionar Participantes
                </NavLink>
                <NavLink to="/" className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded-md transition">
                    Volver al Juego
                </NavLink>
            </nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;