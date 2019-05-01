import magphyxp
import numpy as np
VARY_PTHETA_PPHI = 0
VARY_PTHETA_ENERGY = 1

f = open('/home/bojohnson/Desktop/traces.txt','w')
bifurcation_id = 0
for num_bounces in [8]:
    E = -1/3
    previous_e = -1/3
    previous_t = 0
    v_step = 1e-3
    h = 1e-7
    while (E <= 0):
        m_one = magphyxp.calculate_min(1e-9, 1e-9, num_bounces, E, 1e-7,
        VARY_PTHETA_ENERGY, 1e-7)
        row = np.array([num_bounces,
        np.sqrt(abs(2*m_one.energy + 2/3 - m_one.ptheta**2 - 10*m_one.pphi**2)),
        m_one.ptheta,m_one.pphi,m_one.energy,m_one.t])
        # if m.f < 1e-9 and m.energy > -1/3 and m.energy - previous_e > h and m.t - previous_t > 1 and m.t > 0:
        if (m_one.f < 1e-9 and m_one.energy > -1/3 and
        m_one.energy - previous_e > h and m_one.t > 0.0 and
        m_one.t - previous_t > 1):
            print('{} {} {:<.5f} {:<.5f} {:<.5f} {:<.5f} \
            {} {} {:<.5f}\n'.format(bifurcation_id,num_bounces,
            np.sqrt(abs(2*m_one.energy + 2/3 - m_one.ptheta**2 -
            10*m_one.pphi**2)),m_one.ptheta,m_one.pphi,
            m_one.energy,m_one.rocking_number/2,m_one.rocking_in_phase,m_one.t))
            v = np.array((0,v_step,0))
            s = np.array((row[2],row[3],row[4]))
            while (s[2] < 0):
                s_next = s + v
                s_prev = s_next
                # if (s_next[2] < s[2] or s_next[0] > s[0] or s_next[2] > 0):
                if (s_next[1] > np.sqrt((s_next[2]+1/3-s_next[0]**2/2)/5)):
                    break
                # print('a: {:<.10f} {:<.10f} {:<.10f}'.format(s_next[0],s_next[1],s_next[2]))
                m = magphyxp.calculate_min(s_next[0], s_next[1], num_bounces,
                s_next[2], 1e-7, VARY_PTHETA_ENERGY, 1e-7)
                s_next = np.array((m.ptheta,m.pphi,m.energy))
                v = s_next - s
                s = s_next
                # print('b: {:<.10f} {:<.10f} {:<.10f}'.format(s[0],s[1],s[2]))
                # if (s_next[2] < s_prev[2]):
                #     break
                f.write('{} {} {:<.5f} {:<.5f} {:<.5f} {:<.5f} \
                {} {} {:<.5f}\n'.format(bifurcation_id,num_bounces,
                np.sqrt(abs(2*s[2] + 2/3 - s[0]**2 - 10*s[1]**2)),s[0],s[1],
                s[2],m.rocking_number/2,m_one.rocking_in_phase,m.t))
                f.flush
                v[1] *= 1.1
            previous_e = row[4]
            bifurcation_id = bifurcation_id + 1
        h = h*1.1
        E = E+h

f.close()
